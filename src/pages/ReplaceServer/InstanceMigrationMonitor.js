// (c) Copyright 2018-2019 SUSE LLC
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

import React, { Component } from 'react';
import { translate } from '../../localization/localize.js';
import { ActionButton } from '../../components/Buttons.js';
import { fetchJson } from '../../utils/RestUtils.js';
import { ErrorMessage } from '../../components/Messages.js';
import { ConfirmModal } from '../../components/Modals.js';

// this the modal dialog for user to monitor the instances live
// migration results
class InstanceMigrationMonitor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      errorMsg: undefined,
      migrated: 0,
      migrating: props.migrationData.length, //list of instances with migration started
      pollingTime: new Date()
    };
    // time out after 60 minutes
    this.expired = new Date(this.state.pollingTime);
    this.expired.setMinutes(this.state.pollingTime.getMinutes() + 60);
  }

  componentDidMount() {
    // init fetch
    this.fetchInstances();
    // set up a timer to poll instances
    this.timer = setInterval(() => this.fetchInstances(), 5000);
  }

  componentWillUnmount() {
    // unset polling timer
    if(this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  fetchInstances = () => {
    if(this.isTimeOut() || this.state.migrated === this.props.migrationData.length) {
      // unset polling timer
      if(this.timer) {
        clearInterval(this.timer);
        this.timer = undefined;
      }
      return;
    }

    this.setState({pollingTime: new Date()});
    if (!this.state.loading) {
      let apiUrl =
        '/api/v2/compute/instances/' + this.props.operationProps.oldServer.hostname;
      this.setState({loading: true});
      fetchJson(apiUrl)
        .then(response => {
          this.setState({
            migrating: response.length,
            migrated: this.props.migrationData.length - response.length,
            loading: false
          });
        })
        .catch((error) => {
          let msg = translate('server.deploy.progress.get_instances.error', error.toString());
          this.setState({loading: false, errorMsg: msg});
          if(this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
          }
        });
    }
  }

  handleDone = () => {
    this.props.doneAction({
      migrated: this.state.migrated, migrating: this.state.migrating,
      timeout: this.isTimeOut()});
  }

  handleCancel = () => {
    this.props.cancelAction({
      migrated: this.state.migrated, migrating: this.state.migrating,
      timeout: this.isTimeOut()});
  }

  handleHide = () => {
    if(this.state.migrated === this.props.migrationData.length) {
      this.handleDone();
    }
    else {
      this.handleCancel();
    }
  }

  isTimeOut = () => {
    return this.state.pollingTime.getTime() > this.expired.getTime();
  }

  isDoneDisabled = () => {
    return (
      this.state.loading ||
      this.state.migrated < this.props.migrationData.length ||
      this.isTimeOut()
    );
  }

  isCancelDisabled = () => {
    return (
      this.state.loading ||
      this.state.migrated === this.props.migrationData.length
    );
  }

  renderMigrationProgressInfo() {
    return (
      <table className='table table-condensed'>
        <tbody>
          <tr><th>{translate('server.deploy.progress.migration_started')}</th>
            <td>{this.props.migrationData.length}</td></tr>
          <tr><th>{translate('server.deploy.progress.migration_inprogress')}</th>
            <td>{this.state.migrating}</td></tr>
          <tr><th>{translate('server.deploy.progress.migration_migrated')}</th>
            <td>{this.state.migrated}</td></tr>
        </tbody>
      </table>
    );
  }

  renderErrorMessage() {
    if (this.state.errorMsg) {
      return (
        <div className='notification-message-container'>
          <ErrorMessage
            closeAction={() => this.setState({errorMsg: undefined})}
            message={this.state.errorMsg}>
          </ErrorMessage>
        </div>
      );
    }
  }

  renderFooter() {
    return (
      <div className='btn-row input-button-container'>
        <ActionButton type='default'
          isDisabled={this.isCancelDisabled()}
          clickAction={this.handleCancel} displayLabel={translate('cancel')}/>
        <ActionButton
          isDisabled={this.isDoneDisabled()}
          clickAction={this.handleDone} displayLabel={translate('done')}/>
      </div>
    );
  }

  render() {
    const migratedPct =
      parseFloat(this.state.migrated / this.props.migrationData.length).toFixed(2) * 100,
      barClassNames = 'progress-bar bg-success' + (migratedPct < 5 ? ' zero' : ''),
      finished = this.state.migrated === this.props.migrationData.length,
      barContainerClassNames = 'progress' + (!finished ? ' active' : '');
    return (
      <ConfirmModal
        title={this.props.title}
        onHide={this.handleHide} footer={this.renderFooter()}>
        <div className='migration-monitor'>
          <div className='message-line'>{translate('server.deploy.progress.migration_info',
            this.props.operationProps.oldServer.hostname, this.props.operationProps.server.hostname)}
          </div>
          <div className='message-line'>{this.renderMigrationProgressInfo()}</div>
          <div className={barContainerClassNames}>
            <div className={barClassNames} role="progressbar" style={{width: `${migratedPct}%`}} aria-valuenow="25"
              aria-valuemin="0" aria-valuemax="100">
              {translate('server.deploy.progress.migration_pct', migratedPct)}
            </div>
          </div>
          <If condition={!finished}>
            <i className="eos-icons eos-icon-loading"></i>
          </If>
          {this.renderErrorMessage()}
        </div>
      </ConfirmModal>
    );
  }
}

export default InstanceMigrationMonitor;
