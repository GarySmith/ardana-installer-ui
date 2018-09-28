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

import { translate } from '../localization/localize.js';
import { INSTALL_PLAYBOOK, STATUS } from '../utils/constants.js';
import { ActionButton } from '../components/Buttons.js';
import { YesNoModal } from '../components/Modals.js';
import { ErrorBanner } from '../components/Messages.js';
import BaseWizardPage from './BaseWizardPage.js';
import TransferTable from '../components/TransferTable.js';
import { InputLine } from '../components/InputLine.js';
import { ValidatingInput } from '../components/ValidatingInput.js';
import HelpText from '../components/HelpText.js';
import { PlaybookProgress } from '../components/PlaybookProcess.js';
import { fetchJson, postJson } from '../utils/RestUtils.js';

const OS_INSTALL_STEPS = [
  {
    label: translate('install.progress.step1'),
    playbooks: ['bm-power-status.yml']
  },
  {
    label: translate('install.progress.step2'),
    playbooks: ['cobbler-deploy.yml']
  },
  {
    label: translate('install.progress.step3'),
    playbooks: ['bm-reimage.yml']
  },
  {
    label: translate('install.progress.step4'),
    playbooks: [INSTALL_PLAYBOOK + '.yml']
  }
];


class SelectServersToProvision extends BaseWizardPage {
  constructor(props) {
    super(props);
    this.state = {
      allServers: [],
      leftList: [],
      rightList: [],

      osInstallUsername: '',
      osInstallPassword: '',
      installing: false,
      showModal: false,
      overallStatus: STATUS.UNKNOWN, // overall status of install playbook
      requiresPassword: false,
      sshPassphrase: '',
      hasError: false,
      errorMsg: ''
    };

    this.ips = [];
  }

  // Clear out the global playbookStatus entry for INSTALL_PLAYBOOK,
  // which permits running the installer multiple times
  resetPlaybookStatus = () => {
    if (this.props.playbookStatus) {
      let playStatus = this.props.playbookStatus.slice();
      playStatus.forEach((play) => {
        if (play.name === INSTALL_PLAYBOOK) {
          play.playId = '';
          play.status = '';
        }
      });
      this.props.updateGlobalState('playbookStatus', playStatus);
    }
  }

  goForward = (e) => {
    e.preventDefault();
    // reset so can rerun install
    this.resetPlaybookStatus();
    super.goForward(e);
  }

  goBack = (e) => {
    e.preventDefault();
    // reset so can rerun install
    this.resetPlaybookStatus();
    super.goBack(e);
  }

  componentWillMount() {
    // retrieve a list of servers that have roles
    fetchJson('/api/v1/clm/model/entities/servers')
      .then(responseData => {
        this.setState({
          allServers: responseData,
          leftList: responseData.map(svr => svr.name || svr.id).sort()
        });
      })
      .then(() => fetchJson('/api/v1/ips'))
      .then(data => {this.ips = data;});

    fetchJson('/api/v1/clm/user')
      .then(responseData => {
        this.setState({
          osInstallUsername: responseData['username']
        });
      });

    fetchJson('/api/v1/clm/sshagent/requires_password')
      .then((responseData) => {
        this.setState({
          requiresPassword: responseData['requires_password']
        });
      });
  }

  getPlaybookProgress = () => {
    let playbook =
      this.props.playbookStatus ? this.props.playbookStatus.find((play) => {
        return (play.name === INSTALL_PLAYBOOK && play.playId !== undefined && play.playId !== '');
      }) : undefined;
    return playbook;
  }

  setBackButtonDisabled = () => {
    return this.getPlaybookProgress() && !(
      this.state.overallStatus == STATUS.COMPLETE ||
      this.state.overallStatus == STATUS.FAILED);
  }

  setNextButtonDisabled = () => {
    if (this.getPlaybookProgress()) {
      return this.state.overallStatus != STATUS.COMPLETE;
    } else {
      return this.state.rightList.length > 0;
    }
  }

  handleOsInstallPassword = (e, valid, props) => {
    const password = e.target.value;
    this.setState({osInstallPassword: password});
  }

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
  }

  renderSshPassphraseInputLine() {
    if (this.state.requiresPassword) {
      return (
        <div className='detail-line'>
          <div className='detail-heading'>
            {translate('validate.config.sshPassphrase') + '*'}
            <HelpText tooltipText={translate('validate.config.sshPassphrase.tooltip')}/>
          </div>
          <div className='input-body'>
            <ValidatingInput isRequired='true' inputName='sshPassphrase'
              inputType='password' inputValue={this.state.sshPassphrase}
              inputAction={(e) => {this.setState({sshPassphrase: e.target.value});}}/>
          </div>
        </div>
      );
    }
  }

  startInstalling = () => {
    if (this.state.requiresPassword) {
      let password = {'password': this.state.sshPassphrase};
      postJson('/api/v1/clm/sshagent/key', JSON.stringify(password), undefined, false)
        .then(() => {
          this.setState({
            requiresPassword: false, showModal: false, hasError: false, errorMsg: '', installing: true
          });
        })
        .catch((error) => {
          this.setState({
            hasError: true, errorMsg: error.value['error_msg'], showModal: false, sshPassphrase: ''
          });
        });
    } else {
      this.setState({installing: true, showModal: false});
    }
  }

  showErrorBanner = () => {
    return (
      <div className='banner-container no-margin-bottom'>
        <ErrorBanner message={translate('validate.config.sshPassphrase.error', this.state.errorMsg)}
          show={this.state.hasError}/>
      </div>
    );
  }

  renderTransferTable() {
    return (
      <div>
        <div className='content-header'>
          {this.renderHeading(translate('provision.server.heading'))}
        </div>
        <div className='wizard-content'>
          <div className='server-provision'>
            <div className='password-container'>
              <div className='detail-line'>
                <div className='detail-heading'>{translate('server.user.prompt')}</div>
                <div className='detail-field'>{this.state.osInstallUsername}</div>
              </div>
              <InputLine
                isRequired='true'
                label='server.pass.prompt'
                inputName='osInstallPassword'
                inputType='password'
                inputValue={this.state.osInstallPassword}
                inputAction={this.handleOsInstallPassword}/>
              {this.renderSshPassphraseInputLine()}
            </div>

            <TransferTable
              leftList={this.state.leftList}
              rightList={this.state.rightList}
              updateLeftList={(list) => this.setState({leftList: list})}
              updateRightList={(list) => this.setState({rightList: list})}
              leftTableHeader={translate('provision.server.left.table')}
              rightTableHeader={translate('provision.server.right.table')}/>
            {this.state.hasError && this.showErrorBanner()}
            <div className='button-container'>
              <ActionButton
                displayLabel={translate('provision.server.install')}
                clickAction={() => this.setState({showModal: true})}
                isDisabled={this.state.rightList.length == 0 || this.state.osInstallPassword === ''
                  || (this.state.requiresPassword && this.state.sshPassphrase === '')}/>
            </div>
            <YesNoModal show={this.state.showModal}
              title={translate('warning')}
              yesAction={this.startInstalling}
              noAction={() => this.setState({showModal: false})}>
              {translate('provision.server.confirm.body', this.state.rightList.length)}
            </YesNoModal>
          </div>
        </div>
      </div>
    );
  }

  renderBody() {
    // To show PlaybookProgress UI or not
    if (this.state.installing || this.getPlaybookProgress()) {
      const serversToProvision = this.state.allServers.filter(e =>
        this.state.rightList.includes(e.name || e.id) && ! this.ips.includes(e['ip-addr']));

      const payload = {
        'extra-vars': {
          'nodelist': serversToProvision.map(e => e.id).join(','),
          'ardanauser_password': this.state.osInstallPassword
        }};

      return (
        <div>
          <div className='content-header'>
            {this.renderHeading(translate('provision.server.progress.heading'))}
          </div>
          <div className='wizard-content'>
            <PlaybookProgress
              updatePageStatus={this.updatePageStatus} updateGlobalState={this.props.updateGlobalState}
              playbookStatus={this.props.playbookStatus} steps={OS_INSTALL_STEPS}
              playbooks={[INSTALL_PLAYBOOK]} payload={payload} />
            <div className='banner-container'>
              <ErrorBanner message={translate('provision.server.failure')}
                show={this.state.overallStatus === STATUS.FAILED}/>
            </div>
          </div>
        </div>);
    } else {
      return this.renderTransferTable();
    }
  }

  render() {
    return (
      <div className='wizard-page'>
        {this.renderBody()}
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default SelectServersToProvision;
