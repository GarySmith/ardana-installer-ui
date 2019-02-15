// (c) Copyright 2017-2018 SUSE LLC
/**
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/
import React from 'react';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';

export default function HelpText(props) {
  const tooltip = (
    <Tooltip id="helptext">{props.tooltipText}</Tooltip>
  );

  return (
    <OverlayTrigger placement="auto" overlay={tooltip}>
      <span className='tooltip-icon'>
        <i className='material-icons md-dark'>info</i>
      </span>
    </OverlayTrigger>
  );
}
