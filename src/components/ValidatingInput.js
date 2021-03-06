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
import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import { TRUTHY } from '../utils/constants.js';

export class ValidatingInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorMsg: '',
      showMask: true
    };
  }

  isRequired = () => TRUTHY.includes(this.props.isRequired) || TRUTHY.includes(this.props.required)

  validateInput(val, extraProps) {
    if(this.isRequired() && (val === undefined || val.length === 0)) {
      this.setState({errorMsg: translate('input.required.error')});
      return false;
    }

    if(this.props.inputValidate && val !== '' && val !== undefined) {//have a validator and have some values
      let err;
      try {
        err = this.props.inputValidate(val, extraProps);
      } catch(e) {
        this.setState({errorMsg: translate('input.validator.error')});
        return false;
      }
      if (err) {
        this.setState({ errorMsg: err });
        return false;
      }
    }

    this.setState({errorMsg: undefined});
    return true;
  }

  handleInputChange = (e, props) => {
    let val = e.target.value;
    let valid = this.validateInput(val, props);
    this.setState({
      inputValue: val
    });

    //call back function from parent to handle the change
    this.props.inputAction(e, valid, props);
  }

  toggleShowHidePassword(e) {
    let passwordField = e.target.previousSibling;
    passwordField.type = this.state.showMask ? 'text' : 'password';
    this.setState((prevState) => {return {showMask: !prevState.showMask};});
  }

  render() {
    let inputType = 'text';
    if(this.props.inputType) {
      inputType = this.props.inputType;
    }
    let myprops = {};
    if (inputType === 'number') {
      myprops.min = this.props.min;
      myprops.max = this.props.max;
    }

    let placeholder = this.props.placeholder;

    let togglePassword = '';
    if (inputType === 'password') {
      if (this.state.showMask) {
        togglePassword = <i className='material-icons md-dark password-icon'
          onClick={(e) => this.toggleShowHidePassword(e)}>visibility</i>;
      } else {
        togglePassword = <i className='material-icons md-dark password-icon'
          onClick={(e) => this.toggleShowHidePassword(e)}>visibility_off</i>;
      }
    }

    if (TRUTHY.includes(this.props.disabled)) {
      myprops.disabled = true;
    }

    if (TRUTHY.includes(this.props.autoFocus)) {
      myprops.autoFocus = true;
    }

    if (this.isRequired()) {
      myprops.required = true;

      // append a '*' to the placeholder string
      if (typeof(placeholder) === 'string' && !placeholder.endsWith('*')) {
        placeholder += '*';
      }
    }

    let classname = 'validating-input';
    if (this.props.moreClass) {
      classname += ' ' + this.props.moreClass;
    }

    if (this.props.inputType === 'textarea') {
      return (
        <div className={classname}>
          <textarea
            id={this.props.id}
            className='rounded-corner'
            name={this.props.inputName}
            value={this.props.inputValue}
            onChange={(e) => this.handleInputChange(e, this.props)}
            placeholder={placeholder}
            disabled={this.props.disabled}
            autoFocus={this.props.autoFocus}
            {...myprops}>
          </textarea>
          <div className='error-message'>{this.state.errorMsg}</div>
        </div>
      );
    } else {
      return (
        <div className={classname}>
          <input
            id={this.props.id}
            className='rounded-corner'
            type={inputType}
            name={this.props.inputName}
            value={this.props.inputValue}
            onChange={(e) => this.handleInputChange(e, this.props)}
            placeholder={placeholder}
            disabled={this.props.disabled}
            autoFocus={this.props.autoFocus}
            {...myprops}>
          </input>
          {togglePassword}
          <div className='error-message'>{this.state.errorMsg}</div>
        </div>
      );
    }
  }
}
