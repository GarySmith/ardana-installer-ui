// (c) Copyright 2018 SUSE LLC
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
import BaseUpdateWizardPage from '../BaseUpdateWizardPage.js';
import { LoadingMask } from '../../components/LoadingMask.js';
import { translate } from '../../localization/localize.js';
import { alphabetically } from '../../utils/Sort.js';

// This is the complete page for adding compute servers
// process. It will display newly deployed server hostname,
// server ID and IP.
class CompleteAddServers extends BaseUpdateWizardPage {
  renderServerList() {
    let serverList = this.props.operationProps.newHosts.sort((a, b) => {
      return alphabetically(a['hostname'],b['hostname']);
    }).map((host,idx) => {
      return (
        <li key={idx}>{host['hostname']}
          <ul className='complete-serverdetails'>
            <li key={1}> {translate('id.with_colon') + ' ' + host['id']} </li>
            <li key={2}> {translate('server.details.ip') + ' ' + host['ip']} </li>
          </ul>
        </li>
      );
    });

    return (
      <div className='col-8 addservers-page'>
        <ul className='complete-servernames-list'>{serverList}</ul>
      </div>
    );
  }

  getCompleteTitle = () => {
    let heading =
      this.props.operationProps.activate ?
        translate('server.deploy.activate.addserver.complete') : translate('server.deploy.addserver.complete');
    return heading;
  }

  render() {
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.props.wizardLoading}/>
        <div className='content-header'>{this.renderHeading(this.getCompleteTitle())}</div>
        <div className='wizard-content'>
          {this.renderServerList()}
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default CompleteAddServers;
