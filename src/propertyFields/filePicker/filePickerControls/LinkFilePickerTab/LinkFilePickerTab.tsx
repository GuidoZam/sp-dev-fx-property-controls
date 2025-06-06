import * as React from 'react';

import { GeneralHelper } from '../../../../helpers/GeneralHelper';
import { IFilePickerResult } from '../FilePicker.types';
import { PrimaryButton, DefaultButton, TextField, css } from '@fluentui/react';

import * as strings from 'PropertyControlStrings';
import styles from './LinkFilePickerTab.module.scss';
import { ILinkFilePickerTabProps } from './ILinkFilePickerTabProps';
import { ILinkFilePickerTabState } from './ILinkFilePickerTabState';

export default class LinkFilePickerTab extends React.Component<
  ILinkFilePickerTabProps,
  ILinkFilePickerTabState
> {
  constructor(props: ILinkFilePickerTabProps) {
    super(props);
    this.state = { isValid: false };
  }

  public render(): React.ReactElement<ILinkFilePickerTabProps> {
    const fileUrl = this.state.filePickerResult
      ? this.state.filePickerResult.fileAbsoluteUrl
      : null;
    return (
      <div className={styles.tabContainer}>
        <div className={styles.tabHeaderContainer}>
          <h2 className={styles.tabHeader}>{strings.LinkHeader}</h2>
        </div>
        <div className={css(styles.tab, styles.tabOffset)}>
          <TextField
            multiline={true}
            required={true}
            resizable={false}
            deferredValidationTime={300}
            className={styles.linkTextField}
            label={
              this.props.allowExternalLinks
                ? strings.ExternalLinkFileInstructions
                : strings.LinkFileInstructions
            }
            ariaLabel={
              this.props.allowExternalLinks
                ? strings.ExternalLinkFileInstructions
                : strings.LinkFileInstructions
            }
            defaultValue={'https://'}
            onGetErrorMessage={(value: string) =>
              this._getErrorMessagePromise(value)
            }
            autoAdjustHeight={false}
            underlined={false}
            borderless={false}
            validateOnFocusIn={false}
            validateOnFocusOut={false}
            validateOnLoad={true}
            value={fileUrl}
            onChange={(e, newValue: string) => this._handleChange(newValue)}
          />
        </div>

        <div className={styles.actionButtonsContainer}>
          <div className={styles.actionButtons}>
            <PrimaryButton
              disabled={!this.state.isValid}
              onClick={() => this._handleSave()}
              className={styles.actionButton}
            >
              {strings.OpenButtonLabel}
            </PrimaryButton>
            <DefaultButton
              onClick={() => this._handleClose()}
              className={styles.actionButton}
            >
              {strings.CancelButtonLabel}
            </DefaultButton>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Called as user types in a new value
   */
  private _handleChange = (fileUrl: string): void => {
    const filePickerResult: IFilePickerResult =
      fileUrl && this._isUrl(fileUrl)
        ? {
            fileAbsoluteUrl: fileUrl,
            fileName: GeneralHelper.getFileNameFromUrl(fileUrl),
            fileNameWithoutExtension:
              GeneralHelper.getFileNameWithoutExtension(fileUrl),
            downloadFileContent: () => {
              return this.props.fileSearchService.downloadBingContent(
                fileUrl,
                GeneralHelper.getFileNameFromUrl(fileUrl)
              );
            },
          }
        : null;
    this.setState({
      filePickerResult,
    });
  };

  /**
   * Verifies the url that was typed in
   * @param value
   */
  private _getErrorMessagePromise = async (value: string): Promise<string> => {
    // DOn't give an error for blank or placeholder value, but don't make it a valid entry either
    if (value === undefined || value === 'https://') {
      this.setState({ isValid: false });
      return '';
    }

    // Make sure that user is typing a valid URL format
    if (!this._isUrl(value)) {
      this.setState({ isValid: false });
      return '';
    }

    // If we don't allow external links, verify that we're in the same domain
    if (!this.props.allowExternalLinks && !this._isSameDomain(value)) {
      this.setState({ isValid: false });
      return strings.NoExternalLinksValidationMessage;
    }

    if (!this.props.checkIfFileExists) {
      this.setState({ isValid: true });
      return '';
    }

    const fileExists = await this.props.fileSearchService.checkFileExists(
      value
    );
    this.setState({ isValid: fileExists });

    const strResult = fileExists ? '' : strings.ProvidedValueIsInvalid;
    return strResult;
  };

  /**
   * Handles when user saves
   */
  private _handleSave = (): void => {
    this.props.onSave(this.state.filePickerResult);
  };

  /**
   * HAndles when user closes without saving
   */
  private _handleClose = (): void => {
    this.props.onClose();
  };

  /**
   * Is this a URL ?
   * (insert guy holding a butterfly meme)
   */
  private _isUrl = (fileUrl: string): boolean => {
    try {
      const myURL = new URL(fileUrl.toLowerCase());
      return myURL.host !== undefined;
    } catch {
      return false;
    }
  };

  private _isSameDomain = (fileUrl: string): boolean => {
    const siteUrl: string = this.props.context.pageContext.web.absoluteUrl;
    return (
      GeneralHelper.getAbsoluteDomainUrl(siteUrl) ===
      GeneralHelper.getAbsoluteDomainUrl(fileUrl)
    );
  };
}
