# Bucket - HTTP Server for Experiment Testing

Minimal Zephyr HTTP server firmware for Raspberry Pi Pico 2W that serves
static web content from flash. Used for realistic end-to-end testing of
Roastee web stack experiments.

## Features

- HTTP server on port 80
- WiFi AP and STA modes (configurable via shell)
- DHCP server for AP mode
- Gzip-compressed static file serving
- Shell interface for WiFi configuration

## Target Hardware

- Raspberry Pi Pico 2W (RP2350A + CYW43439 WiFi)
- Board: `rpi_pico2/rp2350a/m33/w`

## Building

```bash
# Build without web content (shows placeholder)
task build-firmware

# Deploy experiment content first
task deploy-exp5-fullstack

# Rebuild to include web content
task rebuild-firmware

# Flash to Pico 2W
task flash-firmware
```

## Usage

1. Flash firmware to Pico 2W
2. Connect to serial console: `task serial-terminal`
3. Start WiFi AP: `wifi ap enable Bucket-XXXX`
4. Connect phone/laptop to "Bucket-XXXX" network
5. Navigate to http://192.168.4.1

### WiFi Shell Commands

```shell
# Start AP mode (open network)
wifi ap enable Bucket-XXXX

# Start AP mode with password
wifi ap enable Bucket-XXXX -p MyPassword123

# Connect to existing network
wifi connect YourSSID YourPassword

# Check connection status
wifi status
```

## Deploying Web Content

Web content is embedded in firmware at compile time. Deploy experiment
builds to `web/` directory before building:

```bash
# Deploy experiment 5 (full stack)
task deploy-exp5-fullstack

# Deploy experiment 1 (SolidJS)
task deploy-exp1-solid

# Clean web content
task clean-web
```

The firmware expects:
- `web/index.html` → Served at `/` and `/index.html`
- `web/app.js` → Served at `/app.js` and `/assets/app.js`
- `web/app.css` → Served at `/app.css` and `/assets/app.css`

Files are gzip-compressed during build for optimal flash usage.

## Memory Usage

Typical firmware size: ~200-300 KB (depending on web content)

| Component | Size |
|-----------|------|
| Zephyr kernel | ~100 KB |
| WiFi stack | ~80 KB |
| HTTP server | ~20 KB |
| Web content | Variable |

## Network Configuration

**AP Mode (default):**
- IP: 192.168.4.1
- DHCP range: 192.168.4.2 - 192.168.4.10
- SSID: Bucket-XXXX (XXXX from device ID)

**STA Mode:**
- DHCP client enabled
- Obtain IP from network

## Related Documentation

- [User Onboarding Research](../../../../origin/documentation/source/development/research/user-onboarding.rst)
- [RP2350 Flash Usage](../../../../origin/documentation/source/development/research/rp2350-flash-usage.rst)
- [Roastee Stack Tests](../../../../origin/documentation/source/development/research/roastee-stack-tests-1.rst)
