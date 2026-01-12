# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.20.0)

# Add Fusain protocol library
list(APPEND EXTRA_ZEPHYR_MODULES ${CMAKE_CURRENT_SOURCE_DIR}/../../../../../modules/lib/fusain)

find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})

project(bucket)

target_sources(app PRIVATE
  src/main.c
  src/ws_fusain.c
)

# Directory containing web resources to serve
set(WEB_RESOURCES_DIR ${CMAKE_CURRENT_SOURCE_DIR}/web)
set(gen_dir ${ZEPHYR_BINARY_DIR}/include/generated/)

# Generate gzip-compressed include files for web resources
# These files will be embedded in the firmware
# Use CMake to define HAS_* macros since __has_include() doesn't work
# with build-time generated files
if(EXISTS ${WEB_RESOURCES_DIR}/index.html)
  generate_inc_file_for_target(app
    ${WEB_RESOURCES_DIR}/index.html
    ${gen_dir}/index.html.gz.inc
    --gzip
  )
  target_compile_definitions(app PRIVATE HAS_INDEX_HTML=1)
else()
  target_compile_definitions(app PRIVATE HAS_INDEX_HTML=0)
endif()

if(EXISTS ${WEB_RESOURCES_DIR}/app.js)
  generate_inc_file_for_target(app
    ${WEB_RESOURCES_DIR}/app.js
    ${gen_dir}/app.js.gz.inc
    --gzip
  )
  target_compile_definitions(app PRIVATE HAS_APP_JS=1)
else()
  target_compile_definitions(app PRIVATE HAS_APP_JS=0)
endif()

if(EXISTS ${WEB_RESOURCES_DIR}/app.css)
  generate_inc_file_for_target(app
    ${WEB_RESOURCES_DIR}/app.css
    ${gen_dir}/app.css.gz.inc
    --gzip
  )
  target_compile_definitions(app PRIVATE HAS_APP_CSS=1)
else()
  target_compile_definitions(app PRIVATE HAS_APP_CSS=0)
endif()

if(EXISTS ${WEB_RESOURCES_DIR}/favicon.svg)
  generate_inc_file_for_target(app
    ${WEB_RESOURCES_DIR}/favicon.svg
    ${gen_dir}/favicon.svg.gz.inc
    --gzip
  )
  target_compile_definitions(app PRIVATE HAS_FAVICON_SVG=1)
else()
  target_compile_definitions(app PRIVATE HAS_FAVICON_SVG=0)
endif()

if(EXISTS ${WEB_RESOURCES_DIR}/favicon.ico)
  generate_inc_file_for_target(app
    ${WEB_RESOURCES_DIR}/favicon.ico
    ${gen_dir}/favicon.ico.gz.inc
    --gzip
  )
  target_compile_definitions(app PRIVATE HAS_FAVICON_ICO=1)
else()
  target_compile_definitions(app PRIVATE HAS_FAVICON_ICO=0)
endif()

# Linker section for HTTP resources
zephyr_linker_sources(SECTIONS sections-rom.ld)
