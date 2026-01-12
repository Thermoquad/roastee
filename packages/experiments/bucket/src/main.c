/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * Bucket - Minimal HTTP server for serving experiment build outputs
 *
 * This firmware serves static web files from flash over WiFi.
 * Configure WiFi via shell:
 *   wifi ap enable Bucket-XXXX     # Start AP mode
 *   wifi connect <ssid> <psk>      # Or connect to existing network
 */

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/net/http/server.h>
#include <zephyr/net/http/service.h>
#include <zephyr/net/net_if.h>
#include <zephyr/net/net_config.h>
#include <zephyr/net/wifi_mgmt.h>
#include <zephyr/net/dhcpv4_server.h>
#include <zephyr/net/websocket.h>
#include <zephyr/drivers/hwinfo.h>

/* WebSocket handler from ws_fusain.c */
extern int ws_fusain_setup(int ws_socket, struct http_request_ctx *request_ctx,
                           void *user_data);

LOG_MODULE_REGISTER(bucket, LOG_LEVEL_INF);

//////////////////////////////////////////////////////////////
// Config
//////////////////////////////////////////////////////////////

#define AP_SSID_PREFIX "Bucket-"
#define DHCP_BASE_ADDR 0xC0A80402 /* 192.168.4.2 */

//////////////////////////////////////////////////////////////
// Static Web Resources (embedded at compile time)
//////////////////////////////////////////////////////////////

/* HAS_INDEX_HTML, HAS_APP_JS, HAS_APP_CSS are defined by CMake based on
 * whether the source files exist in web/ at configure time.
 * __has_include() doesn't work here because the .inc files are generated
 * by build targets that run after preprocessing. */

#if HAS_INDEX_HTML
static uint8_t index_html_gz[] = {
#include "index.html.gz.inc"
};
#endif

#if HAS_APP_JS
static uint8_t app_js_gz[] = {
#include "app.js.gz.inc"
};
#endif

#if HAS_APP_CSS
static uint8_t app_css_gz[] = {
#include "app.css.gz.inc"
};
#endif

#if HAS_FAVICON_SVG
static uint8_t favicon_svg_gz[] = {
#include "favicon.svg.gz.inc"
};
#endif

#if HAS_FAVICON_ICO
static uint8_t favicon_ico_gz[] = {
#include "favicon.ico.gz.inc"
};
#endif

//////////////////////////////////////////////////////////////
// HTTP Resources
//////////////////////////////////////////////////////////////

#if HAS_INDEX_HTML
static struct http_resource_detail_static index_html_resource = {
    .common = {
        .type = HTTP_RESOURCE_TYPE_STATIC,
        .bitmask_of_supported_http_methods = BIT(HTTP_GET),
        .content_encoding = "gzip",
        .content_type = "text/html",
    },
    .static_data = index_html_gz,
    .static_data_len = sizeof(index_html_gz),
};
#endif

#if HAS_APP_JS
static struct http_resource_detail_static app_js_resource = {
    .common = {
        .type = HTTP_RESOURCE_TYPE_STATIC,
        .bitmask_of_supported_http_methods = BIT(HTTP_GET),
        .content_encoding = "gzip",
        .content_type = "application/javascript",
    },
    .static_data = app_js_gz,
    .static_data_len = sizeof(app_js_gz),
};
#endif

#if HAS_APP_CSS
static struct http_resource_detail_static app_css_resource = {
    .common = {
        .type = HTTP_RESOURCE_TYPE_STATIC,
        .bitmask_of_supported_http_methods = BIT(HTTP_GET),
        .content_encoding = "gzip",
        .content_type = "text/css",
    },
    .static_data = app_css_gz,
    .static_data_len = sizeof(app_css_gz),
};
#endif

#if HAS_FAVICON_SVG
static struct http_resource_detail_static favicon_svg_resource = {
    .common = {
        .type = HTTP_RESOURCE_TYPE_STATIC,
        .bitmask_of_supported_http_methods = BIT(HTTP_GET),
        .content_encoding = "gzip",
        .content_type = "image/svg+xml",
    },
    .static_data = favicon_svg_gz,
    .static_data_len = sizeof(favicon_svg_gz),
};
#endif

#if HAS_FAVICON_ICO
static struct http_resource_detail_static favicon_ico_resource = {
    .common = {
        .type = HTTP_RESOURCE_TYPE_STATIC,
        .bitmask_of_supported_http_methods = BIT(HTTP_GET),
        .content_encoding = "gzip",
        .content_type = "image/x-icon",
    },
    .static_data = favicon_ico_gz,
    .static_data_len = sizeof(favicon_ico_gz),
};
#endif

/* Fallback response when no web content is available */
static const char no_content_html[] =
    "<html><head><title>Bucket</title></head><body>"
    "<h1>Bucket HTTP Server</h1>"
    "<p>No web content deployed. Copy experiment build to bucket/web/</p>"
    "<p>Use WiFi shell commands to configure network.</p>"
    "</body></html>";

static struct http_resource_detail_static no_content_resource = {
    .common = {
        .type = HTTP_RESOURCE_TYPE_STATIC,
        .bitmask_of_supported_http_methods = BIT(HTTP_GET),
        .content_type = "text/html",
    },
    .static_data = (uint8_t *)no_content_html,
    .static_data_len = sizeof(no_content_html) - 1,
};

//////////////////////////////////////////////////////////////
// HTTP Service Definition
//////////////////////////////////////////////////////////////

#define HTTP_PORT 80

static uint16_t http_port = HTTP_PORT;

HTTP_SERVICE_DEFINE(bucket_service, NULL, &http_port,
                    CONFIG_HTTP_SERVER_MAX_CLIENTS, 10, NULL, NULL, NULL);

/* Register resources */
#if HAS_INDEX_HTML
HTTP_RESOURCE_DEFINE(index_resource, bucket_service, "/", &index_html_resource);
HTTP_RESOURCE_DEFINE(index_html_explicit, bucket_service, "/index.html",
                     &index_html_resource);
#else
HTTP_RESOURCE_DEFINE(index_resource, bucket_service, "/", &no_content_resource);
#endif

#if HAS_APP_JS
HTTP_RESOURCE_DEFINE(app_js_res, bucket_service, "/app.js", &app_js_resource);
HTTP_RESOURCE_DEFINE(assets_app_js, bucket_service, "/assets/app.js",
                     &app_js_resource);
#endif

#if HAS_APP_CSS
HTTP_RESOURCE_DEFINE(app_css_res, bucket_service, "/app.css", &app_css_resource);
HTTP_RESOURCE_DEFINE(assets_app_css, bucket_service, "/assets/app.css",
                     &app_css_resource);
#endif

#if HAS_FAVICON_SVG
HTTP_RESOURCE_DEFINE(favicon_svg, bucket_service, "/favicon.svg",
                     &favicon_svg_resource);
#endif

#if HAS_FAVICON_ICO
HTTP_RESOURCE_DEFINE(favicon_ico, bucket_service, "/favicon.ico",
                     &favicon_ico_resource);
#endif

//////////////////////////////////////////////////////////////
// WebSocket Endpoint
//////////////////////////////////////////////////////////////

static uint8_t ws_fusain_buffer[256];

static struct http_resource_detail_websocket ws_fusain_resource_detail = {
    .common = {
        .type = HTTP_RESOURCE_TYPE_WEBSOCKET,
        .bitmask_of_supported_http_methods = BIT(HTTP_GET),
    },
    .cb = ws_fusain_setup,
    .data_buffer = ws_fusain_buffer,
    .data_buffer_len = sizeof(ws_fusain_buffer),
};

HTTP_RESOURCE_DEFINE(ws_fusain, bucket_service, "/ws/fusain",
                     &ws_fusain_resource_detail);

//////////////////////////////////////////////////////////////
// WiFi Event Handling
//////////////////////////////////////////////////////////////

static struct net_mgmt_event_callback wifi_cb;

static void wifi_event_handler(struct net_mgmt_event_callback *cb,
                               uint64_t mgmt_event, struct net_if *iface) {
  switch (mgmt_event) {
  case NET_EVENT_WIFI_CONNECT_RESULT: {
    const struct wifi_status *status =
        (const struct wifi_status *)cb->info;
    if (status->status == 0) {
      LOG_INF("WiFi connected");
    } else {
      LOG_ERR("WiFi connection failed: %d", status->status);
    }
    break;
  }
  case NET_EVENT_WIFI_DISCONNECT_RESULT:
    LOG_INF("WiFi disconnected");
    break;
  case NET_EVENT_WIFI_AP_ENABLE_RESULT:
    LOG_INF("WiFi AP mode enabled");
    break;
  case NET_EVENT_WIFI_AP_DISABLE_RESULT:
    LOG_INF("WiFi AP mode disabled");
    break;
  case NET_EVENT_WIFI_AP_STA_CONNECTED:
    LOG_INF("Client connected to AP");
    break;
  case NET_EVENT_WIFI_AP_STA_DISCONNECTED:
    LOG_INF("Client disconnected from AP");
    break;
  default:
    break;
  }
}

//////////////////////////////////////////////////////////////
// SSID Generation
//////////////////////////////////////////////////////////////

static void generate_ssid(char *ssid, size_t len) {
  uint8_t device_id[8];
  ssize_t id_len = hwinfo_get_device_id(device_id, sizeof(device_id));

  if (id_len >= 4) {
    snprintf(ssid, len, "%s%02X%02X%02X%02X", AP_SSID_PREFIX,
             device_id[id_len - 4], device_id[id_len - 3],
             device_id[id_len - 2], device_id[id_len - 1]);
  } else {
    snprintf(ssid, len, "%s0000", AP_SSID_PREFIX);
  }
}

//////////////////////////////////////////////////////////////
// Main
//////////////////////////////////////////////////////////////

int main(void) {
  char ssid[32];

  generate_ssid(ssid, sizeof(ssid));
  LOG_INF("Bucket HTTP Server");
  LOG_INF("Suggested AP SSID: %s", ssid);

  /* Register WiFi event callbacks */
  net_mgmt_init_event_callback(
      &wifi_cb, wifi_event_handler,
      NET_EVENT_WIFI_CONNECT_RESULT | NET_EVENT_WIFI_DISCONNECT_RESULT |
          NET_EVENT_WIFI_AP_ENABLE_RESULT | NET_EVENT_WIFI_AP_DISABLE_RESULT |
          NET_EVENT_WIFI_AP_STA_CONNECTED | NET_EVENT_WIFI_AP_STA_DISCONNECTED);
  net_mgmt_add_event_callback(&wifi_cb);

  /* Start HTTP server */
  http_server_start();

  LOG_INF("HTTP server started on port %d", http_port);
  LOG_INF("Configure WiFi via shell:");
  LOG_INF("  wifi ap enable %s", ssid);
  LOG_INF("  wifi connect -s \"<ssid>\" -p \"<psk>\" -k 1");

#if HAS_INDEX_HTML
  LOG_INF("Serving: index.html (%d bytes gzipped)", sizeof(index_html_gz));
#endif
#if HAS_APP_JS
  LOG_INF("Serving: app.js (%d bytes gzipped)", sizeof(app_js_gz));
#endif
#if HAS_APP_CSS
  LOG_INF("Serving: app.css (%d bytes gzipped)", sizeof(app_css_gz));
#endif
#if !HAS_INDEX_HTML && !HAS_APP_JS && !HAS_APP_CSS
  LOG_WRN("No web content deployed - showing placeholder page");
#endif

  return 0;
}
