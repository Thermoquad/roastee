/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * Fusain WebSocket endpoint - Simulates a diesel burn cycle for testing
 *
 * Cycle (60 seconds total):
 *   0-8s:   PREHEAT        - Glow on, motor ramping up
 *   8-15s:  PREHEAT_STAGE_2 - Glow on, motor at medium speed
 *   15-45s: HEATING        - Burning, pump on, temp rising
 *   45-50s: IDLE           - Everything off, temp falling
 *   50-55s: BLOWING        - Fan mode, motor on
 *   55-60s: IDLE           - Everything off
 *   Repeat...
 */

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/net/http/server.h>
#include <zephyr/net/http/service.h>
#include <zephyr/net/websocket.h>
#include <zephyr/random/random.h>

#include <fusain/fusain.h>

LOG_MODULE_REGISTER(ws_fusain, LOG_LEVEL_INF);

//////////////////////////////////////////////////////////////
// Config
//////////////////////////////////////////////////////////////

#define WS_FUSAIN_INTERVAL_MS 200
#define WS_FUSAIN_MAX_CLIENTS 2
#define WS_FUSAIN_STACK_SIZE 2048
#define FAKE_DEVICE_ADDRESS 0x0123456789ABCDEFULL

/* Cycle timing (in seconds) */
#define PHASE_PREHEAT_END 8
#define PHASE_PREHEAT2_END 15
#define PHASE_HEATING_END 45
#define PHASE_IDLE1_END 50
#define PHASE_BLOWING_END 55
#define PHASE_IDLE2_END 60 /* Total cycle duration */

//////////////////////////////////////////////////////////////
// State
//////////////////////////////////////////////////////////////

struct ws_fusain_ctx {
  int sock;
  struct k_work_delayable work;
  uint32_t sequence;
};

static struct ws_fusain_ctx fusain_ctx[WS_FUSAIN_MAX_CLIENTS];

K_THREAD_STACK_DEFINE(ws_fusain_stack, WS_FUSAIN_STACK_SIZE);
static struct k_work_q ws_fusain_queue;

/* Cycle start time */
static int64_t cycle_start_ms;

/* Simulated values */
static fusain_state_t sim_state = FUSAIN_STATE_IDLE;
static int32_t sim_motor_rpm = 0;
static int32_t sim_motor_target = 0;
static float sim_temperature = 25.0f;
static bool sim_glow_lit = false;
static int32_t sim_pump_rate = 0;

//////////////////////////////////////////////////////////////
// Cycle Simulation
//////////////////////////////////////////////////////////////

static void update_simulation(void) {
  /* Get elapsed time in cycle (0-60 seconds) */
  int64_t now = k_uptime_get();
  int64_t elapsed_ms = now - cycle_start_ms;
  int32_t cycle_sec = (int32_t)((elapsed_ms / 1000) % PHASE_IDLE2_END);

  /* Determine state based on cycle phase */
  fusain_state_t new_state;
  int32_t target_rpm;
  bool glow;
  int32_t pump;

  if (cycle_sec < PHASE_PREHEAT_END) {
    /* PREHEAT: 0-8s - Motor spins up, glow plug warming
     * Per spec: Ignition RPM = 2500, glow plug warmup = 60s (compressed) */
    new_state = FUSAIN_STATE_PREHEAT;
    target_rpm = 1500 + (cycle_sec * 125); /* Ramp 1500 -> 2500 */
    glow = true;
    pump = 0;
  } else if (cycle_sec < PHASE_PREHEAT2_END) {
    /* PREHEAT_STAGE_2: 8-15s - Fuel injection begins, combustion establishing
     * Per spec: Preheating RPM = 2800, combustion establishing = 190°C */
    new_state = FUSAIN_STATE_PREHEAT_STAGE_2;
    target_rpm = 2800;
    glow = true;
    pump = 500; /* Ignition pump rate: rich mixture */
  } else if (cycle_sec < PHASE_HEATING_END) {
    /* HEATING: 15-45s - Stable combustion
     * Per spec: Normal operation = 215°C, pump rate = 250ms */
    new_state = FUSAIN_STATE_HEATING;
    target_rpm = 2800;
    glow = false; /* Glow off once combustion stable (200°C) */
    pump = 250;   /* Preheating/normal pump rate */
  } else if (cycle_sec < PHASE_IDLE1_END) {
    /* IDLE (post-burn): 45-50s */
    new_state = FUSAIN_STATE_IDLE;
    target_rpm = 0;
    glow = false;
    pump = 0;
  } else if (cycle_sec < PHASE_BLOWING_END) {
    /* BLOWING (fan mode): 50-55s
     * Per spec: Cooldown RPM = 2500 */
    new_state = FUSAIN_STATE_BLOWING;
    target_rpm = 2500;
    glow = false;
    pump = 0;
  } else {
    /* IDLE (pre-cycle): 55-60s */
    new_state = FUSAIN_STATE_IDLE;
    target_rpm = 0;
    glow = false;
    pump = 0;
  }

  /* Log state transitions */
  if (new_state != sim_state) {
    LOG_INF("State: %d -> %d (cycle %ds)", sim_state, new_state, cycle_sec);
  }

  sim_state = new_state;
  sim_motor_target = target_rpm;
  sim_glow_lit = glow;
  sim_pump_rate = pump;

  /* Smoothly ramp motor RPM toward target */
  int32_t rpm_diff = sim_motor_target - sim_motor_rpm;
  if (rpm_diff > 100) {
    sim_motor_rpm += 80 + (sys_rand8_get() % 40);
  } else if (rpm_diff < -100) {
    sim_motor_rpm -= 80 + (sys_rand8_get() % 40);
  } else {
    sim_motor_rpm = sim_motor_target;
  }

  /* Add small RPM jitter when running */
  if (sim_motor_rpm > 0) {
    sim_motor_rpm += (sys_rand8_get() % 20) - 10;
    if (sim_motor_rpm < 0) {
      sim_motor_rpm = 0;
    }
  }

  /* Update temperature based on state
   * Per spec thresholds:
   *   Combustion establishing: 190°C
   *   Combustion stable: 200°C
   *   Normal operation: 215°C */
  if (sim_state == FUSAIN_STATE_PREHEAT) {
    /* Slight temperature rise during preheat from glow plug */
    float target = 40.0f + (cycle_sec * 5.0f); /* 40 -> 80°C over 8s */
    sim_temperature += (target - sim_temperature) * 0.15f;
  } else if (sim_state == FUSAIN_STATE_PREHEAT_STAGE_2) {
    /* Combustion establishing - temp rises toward 190°C */
    float phase_progress = (float)(cycle_sec - PHASE_PREHEAT_END) /
                           (float)(PHASE_PREHEAT2_END - PHASE_PREHEAT_END);
    float target = 80.0f + (110.0f * phase_progress); /* 80 -> 190°C */
    sim_temperature += (target - sim_temperature) * 0.2f;
  } else if (sim_state == FUSAIN_STATE_HEATING) {
    /* Stable combustion - temp at 200-215°C */
    float phase_progress = (float)(cycle_sec - PHASE_PREHEAT2_END) /
                           (float)(PHASE_HEATING_END - PHASE_PREHEAT2_END);
    float target = 200.0f + (15.0f * phase_progress); /* 200 -> 215°C */
    sim_temperature += (target - sim_temperature) * 0.1f;
    /* Add noise */
    sim_temperature += ((float)(sys_rand8_get() % 10) - 5.0f) * 0.1f;
  } else {
    /* Temperature falls toward ambient when not heating */
    float decay_rate = (sim_state == FUSAIN_STATE_BLOWING) ? 2.0f : 0.8f;
    if (sim_temperature > 25.0f) {
      sim_temperature -= decay_rate;
      if (sim_temperature < 25.0f) {
        sim_temperature = 25.0f;
      }
    }
  }

  /* Clamp temperature */
  if (sim_temperature < 20.0f) {
    sim_temperature = 20.0f;
  }
  if (sim_temperature > 220.0f) {
    sim_temperature = 220.0f;
  }
}

//////////////////////////////////////////////////////////////
// WebSocket Handler
//////////////////////////////////////////////////////////////

static void fusain_send_telemetry(struct k_work *work) {
  struct k_work_delayable *dwork = k_work_delayable_from_work(work);
  struct ws_fusain_ctx *ctx = CONTAINER_OF(dwork, struct ws_fusain_ctx, work);

  if (ctx->sock < 0) {
    return;
  }

  fusain_packet_t packet;
  uint8_t tx_buffer[FUSAIN_MAX_PACKET_SIZE * 2];
  int len;
  int ret;
  uint32_t timestamp = k_uptime_get_32();

  /* Update simulation */
  update_simulation();

  /* Rotate through different telemetry types */
  switch (ctx->sequence % 4) {
  case 0:
    /* State data */
    fusain_create_state_data(&packet, FAKE_DEVICE_ADDRESS, 0, FUSAIN_ERROR_NONE,
                             sim_state, timestamp);
    break;

  case 1:
    /* Motor data */
    fusain_create_motor_data(&packet, FAKE_DEVICE_ADDRESS, 0, timestamp,
                             sim_motor_rpm, sim_motor_target);
    break;

  case 2:
    /* Temperature data */
    fusain_create_temp_data(&packet, FAKE_DEVICE_ADDRESS, 0, timestamp,
                            sim_temperature);
    break;

  case 3:
    /* Alternating pump/glow data */
    if (ctx->sequence % 8 < 4) {
      fusain_create_pump_data(&packet, FAKE_DEVICE_ADDRESS, 0, timestamp,
                              FUSAIN_PUMP_EVENT_READY, sim_pump_rate);
    } else {
      fusain_create_glow_data(&packet, FAKE_DEVICE_ADDRESS, 0, timestamp,
                              sim_glow_lit);
    }
    break;
  }

  ctx->sequence++;

  /* Encode the packet */
  len = fusain_encode_packet(&packet, tx_buffer, sizeof(tx_buffer));
  if (len < 0) {
    LOG_ERR("Failed to encode Fusain packet: %d", len);
    goto reschedule;
  }

  /* Send via WebSocket as binary */
  ret = websocket_send_msg(ctx->sock, tx_buffer, len,
                           WEBSOCKET_OPCODE_DATA_BINARY, false, true, 100);
  if (ret < 0) {
    LOG_INF("WebSocket send failed (%d), closing", ret);
    websocket_unregister(ctx->sock);
    ctx->sock = -1;
    return;
  }

reschedule:
  k_work_reschedule_for_queue(&ws_fusain_queue, &ctx->work,
                              K_MSEC(WS_FUSAIN_INTERVAL_MS));
}

static int get_free_slot(void) {
  for (int i = 0; i < WS_FUSAIN_MAX_CLIENTS; i++) {
    if (fusain_ctx[i].sock < 0) {
      return i;
    }
  }
  return -1;
}

int ws_fusain_setup(int ws_socket, struct http_request_ctx *request_ctx,
                    void *user_data) {
  int slot = get_free_slot();
  if (slot < 0) {
    LOG_ERR("No free slots for Fusain WebSocket");
    return -ENOENT;
  }

  fusain_ctx[slot].sock = ws_socket;
  fusain_ctx[slot].sequence = 0;

  LOG_INF("Fusain WebSocket connected (slot %d)", slot);

  /* Start sending telemetry */
  k_work_reschedule_for_queue(&ws_fusain_queue, &fusain_ctx[slot].work,
                              K_NO_WAIT);

  return 0;
}

//////////////////////////////////////////////////////////////
// Initialization
//////////////////////////////////////////////////////////////

static int ws_fusain_init(void) {
  struct k_work_queue_config cfg = {.name = "ws_fusain"};

  k_work_queue_init(&ws_fusain_queue);
  k_work_queue_start(&ws_fusain_queue, ws_fusain_stack, WS_FUSAIN_STACK_SIZE, 0,
                     &cfg);

  for (int i = 0; i < WS_FUSAIN_MAX_CLIENTS; i++) {
    fusain_ctx[i].sock = -1;
    k_work_init_delayable(&fusain_ctx[i].work, fusain_send_telemetry);
  }

  /* Initialize cycle start time */
  cycle_start_ms = k_uptime_get();

  LOG_INF("Fusain WebSocket initialized - 60s burn cycle simulation");
  return 0;
}

SYS_INIT(ws_fusain_init, APPLICATION, 0);
