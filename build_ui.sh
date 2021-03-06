#!/bin/bash
# (c) Copyright 2017-2018 SUSE LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#
# This script must be runnable by a system (like OBS) that has no 
# connectivity to the network for downloading dependencies; therefore all
# dependencies must be present already in the node_modules directory.
die() {
   echo "$@" >&2
   exit 1
}

#erase the previous dist
rm -rf dist

#build a bundle version of the javascript
npm run dist || die "npm run dist failed"
