import { Logger                    } from '../modules/logger.js';
import { FsbOptions                } from '../modules/options.js';
import { FileSystemBrokerCommands  } from '../modules/commands.js';
import { FsbEventLogger            } from '../modules/event_logger.js';
import { FileSystemBrokerAPI       } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { FileSystemBrokerSelfTests } from '../modules/selftests.js';
import * as utils from '../modules/utilities.js';


class OptionsUI {
  #CLASS_NAME                            = this.constructor.name;
  #EXT_ID                                = utils.getExtensionId();
  #EXT_NAME                              = utils.getExtensionName();

  #INFO                                  = false;
  #LOG                                   = false;
  #DEBUG                                 = false;
  #WARN                                  = false;

  #windowMode                            = false; // are we running in a popup window??? (from the windowMode parameter in our URL)
  #windowModeRequestedBy                 = undefined;

  #editorModeAdd                         = false;
  #editorModeEdit                        = false;
  #editorEditExtensionId                 = undefined;

  #popupOptionsWindow;
  #backupManagerWindow;
  #eventLogManagerWindow;
  #storageManagerWindow;
  #extensionChooserWindow;
  #confirmDialogWindow;

  #prevFocusedWindowId                   = undefined;

  #EXTENSION_STATS_COL_SPAN              = 4;
  #SHOW_EXTENSION_STATS                  = false;
  #fsbStats;


  #EXTENSION_OPTIONS_TITLE_CLICK_DELAY   = 500;   // 500ms, 1/2 second (the JavaScript runtime does not guarantee this time - it's single-threaded)
  #extensionOptionsTitleClickTimeout     = null;  // for detecting single- vs double-click

  #EXTENSION_ITEM_CLICK_DELAY            = 500;   // 500ms, 1/2 second (the JavaScript runtime does not guarantee this time - it's single-threaded)
  #extensionItemClickTimeout             = null;  // for detecting single- vs double-click

  #devDeleteOldEventLogsTimeout          = null;
  #devRemoveUninstalledExtensionsTimeout = null;



  // gather i18n messages for tooltips (and some other stuff) in the Extension List
  #tooltip_button_add                                                  = utils.getI18nMsg( "options_button_addExtension.tooltip",                            "" );

  #tooltip_checkbox_allowAccess_enabled_unchecked                      = utils.getI18nMsg( "options_checkbox_allowAccess_enabled_unchecked.tooltip",         "" );
  #tooltip_checkbox_allowAccess_enabled_checked                        = utils.getI18nMsg( "options_checkbox_allowAccess_enabled_checked.tooltip",           "" );
  #tooltip_checkbox_allowAccess_disabled_special                       = utils.getI18nMsg( "options_checkbox_allowAccess_disabled_special.tooltip",          "" );
  #tooltip_checkbox_allowAccess_disabled_locked                        = utils.getI18nMsg( "options_checkbox_allowAccess_disabled_locked.tooltip",           "" );

  #tooltip_checkbox_readOnly_enabled_unchecked                         = utils.getI18nMsg( "options_checkbox_readOnly_enabled_unchecked.tooltip",            "" );
  #tooltip_checkbox_readOnly_enabled_checked                           = utils.getI18nMsg( "options_checkbox_readOnly_enabled_checked.tooltip",              "" );
  #tooltip_checkbox_readOnly_disabled_special                          = utils.getI18nMsg( "options_checkbox_readOnly_disabled_special.tooltip",             "" );
  #tooltip_checkbox_readOnly_disabled_locked                           = utils.getI18nMsg( "options_checkbox_readOnly_disabled_locked.tooltip",              "" );
  #tooltip_checkbox_readOnly_disabled_accessDisallowed                 = utils.getI18nMsg( "options_checkbox_readOnly_disabled_accessDisallowed.tooltip",    "" );

  #tooltip_dot_extension_installed                                     = utils.getI18nMsg( "options_dot_extension_installed.tooltip",                        "" );
  #tooltip_dot_extension_not_installed                                 = utils.getI18nMsg( "options_dot_extension_not_installed.tooltip",                    "" );
  #tooltip_dot_extension_disabled                                      = utils.getI18nMsg( "options_dot_extension_disabled.tooltip",                         "" );
  #tooltip_dot_extension_enabled                                       = utils.getI18nMsg( "options_dot_extension_enabled.tooltip",                          "" );

  #tooltip_stats_dot_directory_found                                   = utils.getI18nMsg( "options_stats_dot_directory_found.tooltip",                      "" );
  #tooltip_stats_dot_directory_not_found                               = utils.getI18nMsg( "options_stats_dot_directory_not_found.tooltip",                  "" );
  #tooltip_stats_item_count                                            = utils.getI18nMsg( "options_stats_item_count.tooltip",                               "" );
  #tooltip_stats_total_size_formatted                                  = utils.getI18nMsg( "options_stats_total_size_formatted.tooltip",                     "" );
  #tooltip_stats_total_size_bytes                                      = utils.getI18nMsg( "options_stats_total_size_bytes.tooltip",                         "" );
  #tooltip_stats_directory_not_found                                   = utils.getI18nMsg( "options_stats_directory_not_found.tooltip",                      "" );

  #tooltip_button_edit_disabled_special                                = utils.getI18nMsg( "options_button_editExtension_disabled_special.tooltip",          "" );
  #tooltip_button_edit_disabled_locked                                 = utils.getI18nMsg( "options_button_editExtension_disabled_locked.tooltip",           "" );
  #tooltip_button_edit_enabled                                         = utils.getI18nMsg( "options_button_editExtension_enabled.tooltip",                   "" );

  #tooltip_checkbox_noQuota_enabled_unchecked                          = utils.getI18nMsg( "options_checkbox_noQuotaExtension_enabled_unchecked.tooltip",    "" );
  #tooltip_checkbox_noQuota_enabled_checked                            = utils.getI18nMsg( "options_checkbox_noQuotaExtension_enabled_checked.tooltip",      "" );
  #tooltip_checkbox_noQuota_disabled_special                           = utils.getI18nMsg( "options_checkbox_noQuotaExtension_disabled_special.tooltip",     "" );
  #tooltip_checkbox_noQuota_disabled_locked                            = utils.getI18nMsg( "options_checkbox_noQuotaExtension_disabled_locked.tooltip",      "" );

  #tooltip_checkbox_lock_enabled_unchecked                             = utils.getI18nMsg( "options_checkbox_lockExtension_enabled_unchecked.tooltip",       "" );
  #tooltip_checkbox_lock_enabled_checked                               = utils.getI18nMsg( "options_checkbox_lockExtension_enabled_checked.tooltip",         "" );
  #tooltip_checkbox_lock_disabled_special                              = utils.getI18nMsg( "options_checkbox_lockExtension_disabled_special.tooltip",        "" );

  #tooltip_checkbox_dirProtect_enabled_unchecked                       = utils.getI18nMsg( "options_checkbox_dirProtectExtension_enabled_unchecked.tooltip", "" );
  #tooltip_checkbox_dirProtect_enabled_checked                         = utils.getI18nMsg( "options_checkbox_dirProtectExtension_enabled_checked.tooltip",   "" );
  #tooltip_checkbox_dirProtect_disabled_special                        = utils.getI18nMsg( "options_checkbox_dirProtectExtension_disabled_special.tooltip",  "" );
  #tooltip_checkbox_dirProtect_disabled_locked                         = utils.getI18nMsg( "options_checkbox_dirProtectExtension_disabled_locked.tooltip",   "" );

  #tooltip_button_remove_enabled                                       = utils.getI18nMsg( "options_button_removeExtension_enabled.tooltip",                 "" );
  #tooltip_button_remove_disabled_special                              = utils.getI18nMsg( "options_button_removeExtension_disabled_special.tooltip",        "" );
  #tooltip_button_remove_disabled_locked                               = utils.getI18nMsg( "options_button_removeExtension_disabled_locked.tooltip",         "" );

  #tooltip_button_edit_add                                             = utils.getI18nMsg( "options_fsbExtensionEditAddButton.tooltip",                      "" );
  #tooltip_button_edit_save_addMode                                    = utils.getI18nMsg( "options_fsbExtensionEditSaveButton_addMode.tooltip",             "" );
  #tooltip_button_edit_save_editMode                                   = utils.getI18nMsg( "options_fsbExtensionEditSaveButton_editMode.tooltip",            "" );
  #tooltip_button_edit_cancel_addMode                                  = utils.getI18nMsg( "options_fsbExtensionEditCancelButton_addMode.tooltip",           "" );
  #tooltip_button_edit_cancel_editMode                                 = utils.getI18nMsg( "options_fsbExtensionEditCancelButton_editMode.tooltip",          "" );
  #tooltip_button_edit_error_dismiss                                   = utils.getI18nMsg( "options_fsbExtensionEditErrorDismissButton.tooltip",             "" );

  #extensionListHeader_text_installed                                  = utils.getI18nMsg("options_fsbExtensionListHeader_text_installed.label");
  #extensionListHeader_text_enabled                                    = utils.getI18nMsg("options_fsbExtensionListHeader_text_enabled.label");
  #extensionListHeader_text_id                                         = utils.getI18nMsg("options_fsbExtensionListHeader_text_id.label");
  #extensionListHeader_text_name                                       = utils.getI18nMsg("options_fsbExtensionListHeader_text_name.label");
  #extensionListHeader_text_dirExists                                  = utils.getI18nMsg("options_fsbExtensionListHeader_text_dirExists.label");
  #extensionListHeader_text_itemCount                                  = utils.getI18nMsg("options_fsbExtensionListHeader_text_itemCount.label");
  #extensionListHeader_text_totalSizeFmt                               = utils.getI18nMsg("options_fsbExtensionListHeader_text_totalSizeFmt.label");
  #extensionListHeader_text_totalSizeBytes                             = utils.getI18nMsg("options_fsbExtensionListHeader_text_totalSizeBytes.label");

  #extensionListHeader_tooltip_installed                               = utils.getI18nMsg("options_fsbExtensionListHeader_tooltip_installed.label");
  #extensionListHeader_tooltip_enabled                                 = utils.getI18nMsg("options_fsbExtensionListHeader_tooltip_enabled.label");
  #extensionListHeader_tooltip_id                                      = utils.getI18nMsg("options_fsbExtensionListHeader_tooltip_id.label");
  #extensionListHeader_tooltip_name                                    = utils.getI18nMsg("options_fsbExtensionListHeader_tooltip_name.label");
  #extensionListHeader_tooltip_dirExists                               = utils.getI18nMsg("options_fsbExtensionListHeader_tooltip_dirExists.label");
  #extensionListHeader_tooltip_itemCount                               = utils.getI18nMsg("options_fsbExtensionListHeader_tooltip_itemCount.label");
  #extensionListHeader_tooltip_totalSizeFmt                            = utils.getI18nMsg("options_fsbExtensionListHeader_tooltip_totalSizeFmt.label");
  #extensionListHeader_tooltip_totalSizeBytes                          = utils.getI18nMsg("options_fsbExtensionListHeader_tooltip_totalSizeBytes.label");

  #extensionList_marker_tooltip_special                                = utils.getI18nMsg("options_fsbExtensionList_marker_tooltip_special");
  #extensionList_marker_tooltip_noQuotasSpecial                        = utils.getI18nMsg("options_fsbExtensionList_marker_tooltip_noQuotasSpecial");
  #extensionList_marker_tooltip_quotasDisabled                         = utils.getI18nMsg("options_fsbExtensionList_marker_tooltip_quotasDisabled");
  #extensionList_marker_tooltip_quotasEnabled                          = utils.getI18nMsg("options_fsbExtensionList_marker_tooltip_quotasEnabled");
  #extensionList_marker_tooltip_locked                                 = utils.getI18nMsg("options_fsbExtensionList_marker_tooltip_locked");
  #extensionList_marker_tooltip_dirProtect                             = utils.getI18nMsg("options_fsbExtensionList_marker_tooltip_dirProtect");
  #extensionList_marker_tooltip_accessDisallowed                       = utils.getI18nMsg("options_fsbExtensionList_marker_tooltip_accessDisallowed");

  #extensionListEditorTitleAddMode                                     = utils.getI18nMsg("options_fsbExtensionEditTitleAddMode");
  #extensionListEditorTitleEditMode                                    = utils.getI18nMsg("options_fsbExtensionEditTitleEditMode");
  #extensionListEditErrorExtensionIdEmpty                              = utils.getI18nMsg("options_fsbExtensionEditErrorExtensionIdEmpty");
  #extensionListEditErrorExtensionIdInvalid                            = utils.getI18nMsg("options_fsbExtensionEditErrorExtensionIdInvalid");
  #extensionListEditErrorExtensionIdExists                             = utils.getI18nMsg("options_fsbExtensionEditErrorExtensionIdExists");
  #extensionListEditErrorExtensionNameEmpty                            = utils.getI18nMsg("options_fsbExtensionEditErrorExtensionNameEmpty");
  #extensionListEditErrorExtensionNameInvalid                          = utils.getI18nMsg("options_fsbExtensionEditErrorExtensionNameInvalid");
  #extensionListEditErrorAddFailed                                     = utils.getI18nMsg("options_fsbExtensionEditErrorAddFailed");
  #extensionListEditErrorUpdateFailed                                  = utils.getI18nMsg("options_fsbExtensionEditErrorUpdateFailed");
  #extensionListEditErrorUIUpdateFailed                                = utils.getI18nMsg("options_fsbExtensionEditErrorUIUpdateFailed");

  // developer options
  #i18n_label_dev_options_title                                        = utils.getI18nMsg("options_fsbDevOptionsTitle.label");
  #i18n_check_dev_skipOnboarding                                       = utils.getI18nMsg("options_fsbDevSkipOnboardingCheck.label");
  #i18n_check_dev_showOptionsWindowOnStartup                           = utils.getI18nMsg("options_fsbDevShowOptionsWindowOnStartupCheck.label");
  #i18n_button_dev_resetOptions                                        = utils.getI18nMsg("options_fsbDevResetOptionsButton.label");
  #i18n_button_dev_runSelfTest                                         = utils.getI18nMsg("options_fsbDevSelfTestButton.label");
  #i18n_button_dev_displayOptionsAsPopup                               = utils.getI18nMsg("options_fsbDevDisplayOptionsAsPopupButton.label");
  //
  #i18n_button_dev_deleteOldEventLogs                                  = utils.getI18nMsg("options_fsbDevDeleteOldEventLogsButton.label");
  #i18n_label_dev_deleteOldEventLogsOlderThanNumDaysLabel              = utils.getI18nMsg("options_fsbDevDeleteOldEventLogsOlderThanNumDaysLabel" );
  #i18n_label_dev_deleteOldEventLogsOlderThanDaysLabel                 = utils.getI18nMsg("options_fsbDevDeleteOldEventLogsOlderThanDaysLabel" );
  #i18n_label_dev_deleteOldEventLogsInNumMinutesLabel                  = utils.getI18nMsg("options_fsbDevDeleteOldEventLogsInNumMinutesLabel" );
  #i18n_label_dev_deleteOldEventLogsInMinutesLabel                     = utils.getI18nMsg("options_fsbDevDeleteOldEventLogsInMinutesLabel" );
  #i18n_label_dev_deleteOldEventLogsInNumSecondsLabel                  = utils.getI18nMsg("options_fsbDevDeleteOldEventLogsInNumSecondsLabel" );
  #i18n_label_dev_deleteOldEventLogsInSecondsLabel                     = utils.getI18nMsg("options_fsbDevDeleteOldEventLogsInSecondsLabel" );
  //
  #i18n_button_dev_removeUninstalledExtensions                         = utils.getI18nMsg("options_fsbDevRemoveUninstalledExtensionsButton.label");
  #i18n_label_dev_removeExtensionsUninstalledMoreThanNumDaysAgoLabel   = utils.getI18nMsg("options_fsbDevRemoveExtensionsUninstalledMoreThanNumDaysAgoLabel" );
  #i18n_label_dev_removeExtensionsUninstalledMoreThanDaysAgoLabel      = utils.getI18nMsg("options_fsbDevRemoveExtensionsUninstalledMoreThanDaysAgoLabel" );
  #i18n_label_dev_removeUninstalledExtensionsInNumMinutesLabel         = utils.getI18nMsg("options_fsbDevRemoveUninstalledExtensionsInNumMinutesLabel" );
  #i18n_label_dev_removeUninstalledExtensionsInMinutesLabel            = utils.getI18nMsg("options_fsbDevRemoveUninstalledExtensionsInMinutesLabel" );
  #i18n_label_dev_removeUninstalledExtensionsInNumSecondsLabel         = utils.getI18nMsg("options_fsbDevRemoveUninstalledExtensionsInNumSecondsLabel" );
  #i18n_label_dev_removeUninstalledExtensionsInSecondsLabel            = utils.getI18nMsg("options_fsbDevRemoveUninstalledExtensionsInSecondsLabel" );




  #logger         = new Logger();
  #fsbOptionsApi  = new FsbOptions(this.#logger);
  #fsbCommandsApi = new FileSystemBrokerCommands(this.#logger, this.#fsbOptionsApi);
  #fsbEventLogger = new FsbEventLogger(this.#logger, this.#fsbOptionsApi, this.#fsbCommandsApi);
//#fsBrokerApi    = new FileSystemBrokerAPI();

  constructor() {
    this.#fsbOptionsApi.setEventLogger(this.#fsbEventLogger);
    this.#fsbCommandsApi.setEventLogger(this.#fsbEventLogger);
  }



  info(...info) {
    if (this.#INFO) this.#logger.info(this.#CLASS_NAME, ...info);
  }

  infoAlways(...info) {
    this.#logger.infoAlways(this.#CLASS_NAME, ...info);
  }
  log(...info) {
    if (this.#LOG) this.#logger.log(this.#CLASS_NAME, ...info);
  }

  logAlways(...info) {
    this.#logger.logAlways(this.#CLASS_NAME, ...info);
  }

  debug(...info) {
    if (this.#DEBUG) this.#logger.debug(this.#CLASS_NAME, ...info);
  }

  debugAlways(...info) {
    this.#logger.debugAlways(this.#CLASS_NAME, ...info);
  }

  warn(...info) {
    if (this.#WARN) this.#logger.warn(this.#CLASS_NAME, ...info);
  }

  warnAlways(...info) {
    this.#logger.warnAlways(this.#CLASS_NAME, ...info);
  }

  error(...info) {
    // always log errors
    this.#logger.error(this.#CLASS_NAME, ...info);
  }

  caught(e, msg, ...info) {
    // always log exceptions
    this.#logger.error( this.#CLASS_NAME,
                       msg,
                       "\n name:    " + e.name,
                       "\n message: " + e.message,
                       "\n stack:   " + e.stack,
                       ...info
                     );
  }



  async init(e) {
    this.debug("-- begin");

    const docLocationInfo = utils.parseDocumentLocation(document);
    const params          = docLocationInfo.params;
    if (params) {
      const windowMode = params.get('windowMode');
      this.debug(`-- windowMode="${windowMode}"`);

      this.#windowMode = (windowMode === 'true') ? true : false;

      if (this.#windowMode) {
        const requestedBy = params.get('requestedBy');
        this.debug(`-- windowMode requestedBy="${requestedBy}"`);
        if ((typeof requestedBy === 'string') && requestedBy.length > 0) {
          this.#windowModeRequestedBy = requestedBy;
        }

        document.body.classList.add('popup-window');
        
        const controlsPanel = document.getElementById("fsbOptionsControlsPanel");
        if (! controlsPanel) {
          this.error("FAILED TO GET Controls Panel, id='fsbOptionsControlsPanel'");
        } else {
          controlsPanel.classList.add('popup-options');
        }
      }
    }

    await this.#localizePage();
    await this.#applyTooltips(document);
    await this.#buildUI();
    await this.#setupListeners();

    this.debug("-- end");
  }



  async #windowUnloading(e) {
    if (this.#DEBUG) this.debugAlways( "--- WINDOW UNLOADING ---",
                                       `\n- this.#windowMode=${this.#windowMode}`,
                                       `\n- window.screenTop=${window.screenTop}`,
                                       `\n- window.screenLeft=${window.screenLeft}`,
                                       `\n- window.outerWidth=${window.outerWidth}`,
                                       `\n- window.outerHeight=${window.outerHeight}`,
                                     );

    // We should NOT even have been called unless windowMode=true,
    // otherwise we would NOT have been added as a listnener in the first place, no???
    // But what the heck...
    if (this.#windowMode) {
      await this.#fsbOptionsApi.storeWindowBounds("optionsWindowBounds", window); // use this.#EXT_NAME

      if (this.#DEBUG) {
        const bounds = await this.#fsbOptionsApi.getWindowBounds("optionsWindowBounds"); // use this.#EXT_NAME

        if (! bounds) {
          this.debugAlways("--- WINDOW UNLOADING --- Retrieve Stored Window Bounds - FAILED TO GET bounds ---");
        } else if (typeof bounds !== 'object') {
          this.debugAlways(`--- WINDOW UNLOADING --- Retrieve Stored Window Bounds - bounds IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
        } else {
          this.debugAlways( "--- Retrieve Stored Window Bounds ---",
                            `\n- bounds.top:    ${bounds.top}`,
                            `\n- bounds.left:   ${bounds.left}`,
                            `\n- bounds.width:  ${bounds.width}`,
                            `\n- bounds.height: ${bounds.height}`,
                          );
        }
      }
    }

    // Tell Thunderbird to close the window
    e.returnValue = '';  // any "non-truthy" value will do
    return false;
  }



  async #localizePage() { // we could pass this the Document and then we could move it to utilities.js
    this.debug("-- start");

    for (const el of document.querySelectorAll("[data-l10n-id]")) {
      const id = el.getAttribute("data-l10n-id");
      const i18nMessage = utils.getI18nMsg(id);
      el.textContent = i18nMessage;
    }

    for (const el of document.querySelectorAll("[data-html-l10n-id]")) {
      const id = el.getAttribute("data-html-l10n-id");
      const i18nMessage = utils.getI18nMsg(id);
      el.insertAdjacentHTML('afterbegin', i18nMessage);
    }

    this.debug("-- end");
  }



  async #applyTooltips(theDocument) { // we could move this to utilities.js
    this.debug("-- start");

    for (const el of theDocument.querySelectorAll("[tooltip-l10n-id]")) {
      const id = el.getAttribute("tooltip-l10n-id");
      const i18nMessage = utils.getI18nMsg(id);
      el.setAttribute("title", i18nMessage);
    }

    this.debug("-- end");
  }



  async #setupListeners() {
    this.debug(`-- start -- windowMode=${this.#windowMode}`);

    document.addEventListener( "change", (e) => this.#optionChanged(e) );   // One of the checkboxes or radio buttons, etc, was clicked or a select has changed
    document.addEventListener( "click",  (e) => this.#actionClicked(e) );   // An Actions button was clicked (or a label, since <label for="xx"> does not work)

    const extensionOptionsTitleDiv = document.getElementById("fsbExtensionOptionsTitle");
    if (extensionOptionsTitleDiv) {
      document.addEventListener( "dblclick",  (e) => this.#extensionOptionsTitleDivDoubleClicked(e) );
    }

    if (this.#windowMode) {
      this.debug("-- Adding beforeunload Window Event Listener");
      window.addEventListener("beforeunload", (e) => this.#windowUnloading(e));
    }

    this.debug("-- end");
  }



  async #buildUI() {
    this.debug("-- start");

    this.#resetErrors();
    this.#resetMessages();

    const accessControlEnabled = await this.#fsbOptionsApi.isEnabledExtensionAccessControl();
    this.#showHideExtensionAccessControls(accessControlEnabled);

//  const showLoggingOptions = await this.#fsbOptionsApi.isEnabledShowLoggingOptions(); // #updateOptionsUI should do this one now
//  this.#showHideLoggingOptions(showLoggingOptions);

//  const showHints = await this.#fsbOptionsApi.isEnabledShowOptionsHints(); // #updateOptionsUI should do this one now
//  this.#showHideHints(showHints);

    const showActions = await this.#fsbOptionsApi.isEnabledShowOptionsActions();
    this.#showHideActions(showActions);

    const isEnabledShowDeveloperOptions = await this.#fsbOptionsApi.isEnabledOption("fsbShowDeveloperOptions");
    if (isEnabledShowDeveloperOptions) {
      await this.#addDeveloperOptions();
    } else {
      this.#removeDeveloperOptions();
    }

    this.#populateSelectUIs();
    await this.#updateOptionsUI();
    await this.#buildExtensionsListUI();
    await this.#enableExtensionAccessControls(true);

    this.debug("-- end");
  }



  #populateSelectUIs() {
    this.#populateAutoLogPurgeDaysSelectUI();
    this.#populateAutoRemoveUninstalledExtensionsDaysSelectUI();
  }

  #populateAutoLogPurgeDaysSelectUI() {
    const select = document.getElementById("fsbAutoLogPurgeDays");
    if (select) {
      var option = document.createElement("option");
        option.value = 0;
        option.textContent = utils.getI18nMsg("options_fsbAutoLogPurgeDaysSelect_optionNone");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 2;
        option.textContent = utils.getI18nMsg("options_fsbAutoLogPurgeDaysSelect_2Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 3;
        option.textContent = utils.getI18nMsg("options_fsbAutoLogPurgeDaysSelect_3Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 4;
        option.textContent = utils.getI18nMsg("options_fsbAutoLogPurgeDaysSelect_4Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 5;
        option.textContent = utils.getI18nMsg("options_fsbAutoLogPurgeDaysSelect_5Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 6;
        option.textContent = utils.getI18nMsg("options_fsbAutoLogPurgeDaysSelect_6Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 7;
        option.textContent = utils.getI18nMsg("options_fsbAutoLogPurgeDaysSelect_7Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 10;
        option.textContent = utils.getI18nMsg("options_fsbAutoLogPurgeDaysSelect_10Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 14;
        option.textContent = utils.getI18nMsg("options_fsbAutoLogPurgeDaysSelect_14Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 21;
        option.textContent = utils.getI18nMsg("options_fsbAutoLogPurgeDaysSelect_21Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 30;
        option.textContent = utils.getI18nMsg("options_fsbAutoLogPurgeDaysSelect_30Days");
      select.appendChild(option);
    }
  }

  #populateAutoRemoveUninstalledExtensionsDaysSelectUI() {
    const select = document.getElementById("fsbAutoRemoveUninstalledExtensionsDays");
    if (select) {
      var option;

      option = document.createElement("option");
        option.value = -1;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_optionDisabled");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 0;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_optionWhenUninstalled");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 1;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_1Day");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 2;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_2Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 3;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_3Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 4;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_4Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 5;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_5Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 6;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_6Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 7;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_7Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 10;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_10Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 14;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_14Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 21;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_21Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 30;
        option.textContent = utils.getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_30Days");
      select.appendChild(option);
    }
  }



  async #refreshExtensionListUI(e) { // the event is not used - is it even useful?
    this.debug("-- start");

    await this.#buildExtensionsListUI(e);
    await this.#enableExtensionAccessControls(true);

    this.debug("-- end");
  }



  async #enableExtensionAccessControls(enable) {
    this.debug(`-- start -- enable=${enable}`);

    const extensionSelected = this.#getSelectedExtensionCount() > 0;

    var selector;
    var button;

    /* if enable is true, enable "Refresh List" Button, otherwise disable it  */
    selector = "button#fsbRefreshListButton";
    button = document.querySelector(selector);
    if (button) button.disabled = ! enable;

    /* if enable is true, enable "Allow All" Button, otherwise disable it  */
    selector = "button#fsbAllowAllButton";
    button = document.querySelector(selector);
    if (button) button.disabled = ! enable;

    /* if enable is true, enable "Disallow All" Button, otherwise disable it  */
    selector = "button#fsbDisallowAllButton";
    button = document.querySelector(selector);
    if (button) button.disabled = ! enable;

    /* if enable is true and one or more extensions is selected, enable "Allow Selected" Button, otherwise disable it  */
    selector = "button#fsbAllowSelectedButton";
    button = document.querySelector(selector);
    if (button) button.disabled = enable ? ! extensionSelected : true;

    /* if enable is true and one or more extensions is selected, enable "Disallow Selected" Button, otherwise disable it  */
    selector = "button#fsbDisallowSelectedButton";
    button = document.querySelector(selector);
    if (button) button.disabled = enable ? ! extensionSelected : true;

    /* if enable is true and one or more extensions is selected, enable "Delete Selected" Button Label, otherwise disable it  */
    selector = "button#fsbDeleteSelectedButton";
    button = document.querySelector(selector);
    if (button) button.disabled = enable ? ! extensionSelected : true;

    /* if enable is true, enable "Add New" Extension Button, otherwise disable it  */
    selector = "button#fsbAddNewExtensionButton";
    button = document.querySelector(selector);
    if (button) button.disabled = ! enable;

    /* if enable is true, enable "Installed Extensions" Button */
    selector = "button#fsbAddInstalledExtensionsButton";
    button = document.querySelector(selector);
    if (button) button.disabled = ! enable;

    this.debug("-- end");
  }



  async #updateOptionsUI() {
    this.debug("-- start");

    const options = await this.#fsbOptionsApi.getAllOptions();

    this.debug("-- sync options to UI");
    for (const [optionName, optionValue] of Object.entries(options)) {
      this.debug("-- option: ", optionName, "value: ", optionValue);

      const optionElement = document.getElementById(optionName);

      if (optionElement && optionElement.classList.contains("fsbGeneralOption")) {
        if (optionElement.tagName === 'INPUT') {
          if (optionElement.type === 'checkbox') {
            optionElement.checked = optionValue;
            if (optionElement.classList.contains("open-close-check")) {
              await this.#openCloseCheckboxChanged(optionElement);
            }
          } else if (optionElement.type === 'radio') { // MABXXX this needs to reset other radio buttons with the sane "name" (in the same group)
            optionElement.value = optionValue;
          } else if (optionElement.type === 'text') {
            // we don't handle this yet...
            optionElement.value = optionValue;
          }
        } else if (optionElement.tagName === 'SELECT') {
          optionElement.value = optionValue;
        }
      }
    }

    this.debug("-- end");
  }



  async #buildExtensionsListUI(e) { // the event is not used - is it even useful?
    this.debug("-- start");

    this.#resetErrors();
    this.#resetMessages();

    const domFsbExtensionList = document.getElementById("fsbExtensionList");
    if (! domFsbExtensionList) {
      this.error("-- Failed to find #fsbExtensionList");
      this.#setErrorFor("fsbExtensionOptionsTitle", "options_message_error_noExtensionList");
      return;
    }

    // Empty the any current Extension IDs List and add the "Loading Extension IDs List" DIV
    domFsbExtensionList.innerHTML = '';
    const i18nMessage = utils.getI18nMsg("options_fsbExtensionsLoadingMessage", "...");
    const loadingDiv = document.createElement("tr");
    loadingDiv.classList.add("data-loading-message");
    loadingDiv.appendChild( document.createTextNode(i18nMessage) );
    domFsbExtensionList.appendChild(loadingDiv);

    // get extension stats
    const response = await this.#fsbCommandsApi.fsbStats();
    if (response && response.stats && (typeof response.stats) === 'object') {
      this.#SHOW_EXTENSION_STATS = true;
      this.#fsbStats            = response.stats;
    }

    // Remove the "Loading Extension IDs List" DIV and build the actual List UI
    domFsbExtensionList.innerHTML = '';

    const extensionListHeaderItemUI = this.#buildExtensionListHeaderItemUI();
    domFsbExtensionList.appendChild(extensionListHeaderItemUI);

    const extensionEditTitleUI = this.#buildExtensionEditTitleItemUI();
    domFsbExtensionList.appendChild(extensionEditTitleUI);

    const extensionEditUI = this.#buildExtensionEditItemUI();
    domFsbExtensionList.appendChild(extensionEditUI);

    const extensionEditErrorUI = this.#buildExtensionEditErrorItemUI();
    domFsbExtensionList.appendChild(extensionEditErrorUI);

    const allExtensionsProps = await this.#fsbOptionsApi.getExtensionsPropsSortedByName();
    if (this.#DEBUG) {
      this.logAlways(`-- typeof allExtensionsProps='${typeof allExtensionsProps}'`);
      utils.logProps("", "#buildExtensionsListUI.allExtensionsProps", allExtensionsProps);
    }

    if (typeof allExtensionsProps !== 'object') {
      this.error("-- allExtensionsProps is NOT an object");

    } else {
      if (this.#DEBUG) {
        this.debugAlways("-- Extension Props, length=" + Object.entries(allExtensionsProps).length);
        utils.logProps("", "#buildExtensionsListUI.Extension Props", allExtensionsProps);
      }

      const installedExtensions = await messenger.management.getAll();

      for (const [extensionId, extensionProps] of Object.entries(allExtensionsProps)) {
        this.debug(`-- adding Extension -- extensionId="${extensionId}"`);

        var extensionInfo;
        if (installedExtensions) {
          extensionInfo = installedExtensions.find( extension =>
            {
              return (extension.type === 'extension' && extension.id === extensionId);
            }
          );
          this.debug("---extensionInfo\n", extensionInfo);
        }

        if (! extensionInfo) {
          this.debug("---NO extensionInfo");
        } else {
          this.debug("\n---extensionInfo:\n", extensionInfo);
        }

        var extDirStats = (this.#fsbStats && this.#fsbStats.dirStats && (extensionId in this.#fsbStats.dirStats)) ? this.#fsbStats.dirStats[extensionId] : null;

        const extensionListItemUI = await this.#buildExtensionListItemUI(extensionId, extensionProps, extDirStats, extensionInfo);
        domFsbExtensionList.appendChild(extensionListItemUI);

        this.debug(`-- finished adding Extension -- extensionId="${extensionId}"`);
      }
    }

    this.debug("-- end");
  }



  #buildExtensionListHeaderItemUI() {
    const thead = document.createElement("thead");
      thead.classList.add("extension-head-item");                        // extension-head-item

      const controlsLeftTH = document.createElement("th");
        controlsLeftTH.classList.add("extension-head-controls-left");    // extension-head-item > extension-head-controls-left
////////controlsLeftTH.classList.add("extension-head-data");             // extension-head-item > extension-head-data
        const controlsLeftLabel = document.createElement("label");
        controlsLeftTH.appendChild(controlsLeftLabel);
      thead.appendChild(controlsLeftTH);

      const extensionInstalledTH = document.createElement("th");
        extensionInstalledTH.classList.add("extension-head-data");            // extension-head-item > extension-head-data
        extensionInstalledTH.setAttribute("title", this.#extensionListHeader_tooltip_installed);
        const extensionInstalledLabel = document.createElement("label");
          extensionInstalledLabel.appendChild( document.createTextNode(this.#extensionListHeader_text_installed) );
        extensionInstalledTH.appendChild(extensionInstalledLabel);
      thead.appendChild(extensionInstalledTH);

      const extensionEnabledTH = document.createElement("th");
        extensionEnabledTH.classList.add("extension-head-data");            // extension-head-item > extension-head-data
        extensionEnabledTH.setAttribute("title", this.#extensionListHeader_tooltip_enabled);
        const extensionEnabledLabel = document.createElement("label");
          extensionEnabledLabel.appendChild( document.createTextNode(this.#extensionListHeader_text_enabled) );
        extensionEnabledTH.appendChild(extensionEnabledLabel);
      thead.appendChild(extensionEnabledTH);

      const extensionNameTH = document.createElement("th");
        extensionNameTH.classList.add("extension-head-data");            // extension-head-item > extension-head-data
        extensionNameTH.setAttribute("title", this.#extensionListHeader_tooltip_name);
        const extensionNameLabel = document.createElement("label");
          extensionNameLabel.appendChild( document.createTextNode(this.#extensionListHeader_text_name) );
        extensionNameTH.appendChild(extensionNameLabel);
      thead.appendChild(extensionNameTH);

      const extensionIdTH = document.createElement("th");
        extensionIdTH.classList.add("extension-head-data");              // extension-head-item > extension-head-data
        extensionIdTH.setAttribute("title", this.#extensionListHeader_tooltip_id);
        const extensionIdLabel = document.createElement("label");
          extensionIdLabel.appendChild( document.createTextNode(this.#extensionListHeader_text_id) );
        extensionIdTH.appendChild(extensionIdLabel);
      thead.appendChild(extensionIdTH);

      if (this.#SHOW_EXTENSION_STATS) {
        const extensionDirExistsTH = document.createElement("th");
          extensionDirExistsTH.setAttribute("title", this.#extensionListHeader_tooltip_dirExists);
          extensionDirExistsTH.classList.add("extension-head-data");     // extension-head-item > extension-head-data
          const extensionDirExistsLabel = document.createElement("label");
            extensionDirExistsLabel.appendChild( document.createTextNode(this.#extensionListHeader_text_dirExists) );
          extensionDirExistsTH.appendChild(extensionDirExistsLabel);
        thead.appendChild(extensionDirExistsTH);

        const extensionItemCountTH = document.createElement("th");
          extensionItemCountTH.setAttribute("title", this.#extensionListHeader_tooltip_itemCount);
          extensionItemCountTH.classList.add("extension-head-data");  // extension-head-item > extension-head-data
          const extensionItemCountLabel = document.createElement("label");
            extensionItemCountLabel.appendChild( document.createTextNode(this.#extensionListHeader_text_itemCount) );
          extensionItemCountTH.appendChild(extensionItemCountLabel);
        thead.appendChild(extensionItemCountTH);

        const extensionTotalSizeFmtTH = document.createElement("th");
          extensionTotalSizeFmtTH.setAttribute("title", this.#extensionListHeader_tooltip_totalSizeFmt);
          extensionTotalSizeFmtTH.classList.add("extension-head-data");  // extension-head-item > extension-head-data
          const extensionTotalSizeFmtLabel = document.createElement("label");
            extensionTotalSizeFmtLabel.appendChild( document.createTextNode(this.#extensionListHeader_text_totalSizeFmt) );
          extensionTotalSizeFmtTH.appendChild(extensionTotalSizeFmtLabel);
        thead.appendChild(extensionTotalSizeFmtTH);

        const extensionTotalSizeBytesTH = document.createElement("th");
          extensionTotalSizeBytesTH.setAttribute("title", this.#extensionListHeader_tooltip_totalSizeBytes);
          extensionTotalSizeBytesTH.classList.add("extension-head-data");// extension-head-item > extension-head-data
          const extensionTotalSizeBytesLabel = document.createElement("label");
            extensionTotalSizeBytesLabel.appendChild( document.createTextNode(this.#extensionListHeader_text_totalSizeBytes) );
          extensionTotalSizeBytesTH.appendChild(extensionTotalSizeBytesLabel);
        thead.appendChild(extensionTotalSizeBytesTH);
      }

//    const controlsRightTH = document.createElement("th");
//      controlsRightTH.classList.add("extension-head-controls-right");  // extension-head-item > extension-head-controls-right
////////controlsRightTH.classList.add("extension-head-data");            // extension-head-item > extension-head-data
//      const controlsRightLabel = document.createElement("label");
//      controlsRightTH.appendChild(controlsRightLabel);
//    thead.appendChild(controlsRightTH);

      // Create controls-right element and add it to the row
      const controlsRightTH = document.createElement("td");
        controlsRightTH.classList.add("extension-head-controls-right"); // extension-head-item > extension-head-controls-right

        const editControlsDiv = document.createElement("div");
          editControlsDiv.classList.add("extension-controls-panel");    // extension-head-item > extension-head-controls-right > extension-controls-panel
          editControlsDiv.classList.add("edit-controls");               // extension-head-item > extension-head-controls-right > edit-controls
          editControlsDiv.classList.add("extension-edit-controls");     // extension-head-item > extension-head-controls-right > extension-edit-controls

          const addButton = document.createElement("button");
            addButton.classList.add("extension-head-button");      // extension-head-item > extension-head-controls-right > extension-edit-controls > extension-head-button
            addButton.classList.add("extension-icon-button");      // extension-head-item > extension-head-controls-right > extension-edit-controls > extension-icon-button
            addButton.classList.add("extension-list-icon-button"); // extension-head-item > extension-head-controls-right > extension-edit-controls > extension-list-icon-button
            addButton.classList.add("icon-only");                  // extension-head-item > extension-head-controls-right > extension-edit-controls > icon-only
            addButton.classList.add("add-extension");              // extension-head-item > extension-head-controls-right > extension-edit-controls > add-extension
            if (this.#tooltip_button_add) addButton.setAttribute("title", this.#tooltip_button_add);
            addButton.addEventListener("click", (e) => this.#extensionControlButtonClicked(e));
          editControlsDiv.appendChild(addButton);

//        const removeButton = document.createElement("button");
//          removeButton.classList.add("extension-head-button");      // extension-head-item > extension-head-controls-right > extension-edit-controls > extension-head-button
//          removeButton.classList.add("extension-icon-button");      // extension-head-item > extension-head-controls-right > extension-edit-controls > extension-icon-button
//          removeButton.classList.add("extension-list-icon-button"); // extension-head-item > extension-head-controls-right > extension-edit-controls > extension-list-icon-button
//          removeButton.classList.add("icon-only");                  // extension-head-item > extension-head-controls-right > extension-edit-controls > icon-only
//          removeButton.classList.add("remove-extension");           // extension-head-item > extension-head-controls-right > extension-edit-controls > remove-extension
//          removeButton.setAttribute("extensionId", extensionId);
//          if (this.#tooltip_button_remove) removeButton.setAttribute("title", this.#tooltip_button_remove);
//          if (locked) {
//            removeButton.disabled = true;
//          } else {
//            removeButton.addEventListener("click", (e) => this.#extensionControlButtonClicked(e));
//          }
//        editControlsDiv.appendChild(removeButton);
        controlsRightTH.appendChild(editControlsDiv);
      thead.appendChild(controlsRightTH);

    return thead;
  }



  #buildExtensionEditTitleItemUI() {
    const extensionEditTitleTR = document.createElement("tr");
      extensionEditTitleTR.setAttribute("id", "extension_edit_title");
      extensionEditTitleTR.classList.add("extension-edit-title-item");              // extension-edit-title_item
      extensionEditTitleTR.classList.add('display-none');                           // HIDE the Row - turn ON display: none

      // Create empty controls-left element and add it to the row
      const emptyLeftTD = document.createElement("td");
        emptyLeftTD.classList.add("extension-edit-title-empty");                   // extension-edit-title-item > extension-edit-title-empty
      extensionEditTitleTR.appendChild(emptyLeftTD);

      var span = 4;
      if (this.#SHOW_EXTENSION_STATS) span += this.#EXTENSION_STATS_COL_SPAN;

      // Create Extension Title Text element and add it to the row
      const extensionTitleTextTD = document.createElement("td");
        extensionTitleTextTD.setAttribute("colspan", span.toString());
        extensionTitleTextTD.classList.add("extension-edit-title-data");            // extension-edit-title-item > extension-edit-title-data
        const extensionTitleTextLabel = document.createElement("label");
          extensionTitleTextLabel.setAttribute("id", "extension_edit_title_text");  // extension-edit-title-item > extension-edit-title-data > extension_edit_text
        extensionTitleTextTD.appendChild(extensionTitleTextLabel);
      extensionEditTitleTR.appendChild(extensionTitleTextTD);

      // Create empty controls-right element and add it to the row
      const emptyRightTD = document.createElement("td");
        emptyRightTD.classList.add("extension-edit-title-empty");                   // extension-edit-title-item > extension-edit-title-empty
      extensionEditTitleTR.appendChild(emptyRightTD);

    return extensionEditTitleTR;
  }



  #buildExtensionEditItemUI() {
    const extensionEditTR = document.createElement("tr");
      extensionEditTR.setAttribute("id", "extension_edit");
      extensionEditTR.classList.add("extension-edit-item");                   // extension-edit-item
      extensionEditTR.classList.add('display-none');                          // HIDE the Editor Fields Row - turn ON display: none

      // Create allow access checkbox inside a TD and add it to the row
      const controlsLeftTD = document.createElement("td");
        controlsLeftTD.classList.add("extension-edit-controls-left");         // extension-edit-item > extension-edit-controls-left
        const editAllowAccessCheck = document.createElement("input");  // MABXXX JUST A REGULAR CHECKBOX FOR NOW
          editAllowAccessCheck.setAttribute( "type", "checkbox"                        );
          editAllowAccessCheck.setAttribute( "id", "extension_edit_check_allow_access" );
          editAllowAccessCheck.classList.add("extension-check");                  // extension-edit-item > extension-edit-controls-left > extension-check
          editAllowAccessCheck.classList.add("extension-edit-check");             // extension-edit-item > extension-edit-controls-left > extension-edit-check
          editAllowAccessCheck.checked = false;
          editAllowAccessCheck.setAttribute("title", this.#tooltip_checkbox_allowAccess_enabled_unchecked);
          editAllowAccessCheck.addEventListener("change", (e) => this.#extensionOptionCheckChanged(e), true); // <====== NOTE: event "capturing" phase
        controlsLeftTD.appendChild(editAllowAccessCheck);
      extensionEditTR.appendChild(controlsLeftTD);

      // Create space element for Installed & Enabled elements and add it to the row
      const extensionInstalledEnabledTD = document.createElement("td");
        extensionInstalledEnabledTD.classList.add("extension-edit-data");     // extension-edit-error-item > extension-edit-data
        extensionInstalledEnabledTD.setAttribute("colspan", "2");
      extensionEditTR.appendChild(extensionInstalledEnabledTD);

      // Create Extension Name element and add it to the row
      const extensionNameTD = document.createElement("td");
        extensionNameTD.classList.add("extension-edit-data");                 // extension-edit-item > extension-edit-data
        const extensionNameText = document.createElement("input");
          extensionNameText.setAttribute("type", "text");
          extensionNameText.setAttribute("id", "extension_edit_text_name");   // extension-edit-item > extension-edit-data > extension_edit_text_name
          extensionNameText.classList.add("extension-edit-text");             // extension-edit-item > extension-edit-data > extension-edit-text
          extensionNameText.classList.add("no-css");                          // Tell userContent.css NOT to change me!!!
        extensionNameTD.appendChild(extensionNameText);
      extensionEditTR.appendChild(extensionNameTD);

      // Create Extension Id element and add it to the row
      const extensionIdTD = document.createElement("td");
        extensionIdTD.classList.add("extension-edit-data");                   // extension-edit-item > extension-edit-data
        const extensionIdText = document.createElement("input");
          extensionIdText.setAttribute("type", "text");
          extensionIdText.setAttribute("id", "extension_edit_text_id");       // extension-edit-item > extension-edit-data > extension_edit_text_id
          extensionIdText.classList.add("extension-edit-text");               // extension-edit-item > extension-edit-data > extension-edit-text
          extensionIdText.classList.add("no-css");                            // Tell userContent.css NOT to change me!!!
        extensionIdTD.appendChild(extensionIdText);
      extensionEditTR.appendChild(extensionIdTD);

      if (this.#SHOW_EXTENSION_STATS) {
        const extensionStatsTD = document.createElement("td");
          extensionStatsTD.classList.add("extension-edit-data");             // extension-edit-item > extension-edit-data
          extensionStatsTD.setAttribute("colspan", this.#EXTENSION_STATS_COL_SPAN.toString());
        extensionEditTR.appendChild(extensionStatsTD);
      }

      // MABXXX Lock & Protect Checkboxes???

      // Create controls-right element and add it to the row
      const controlsRightTD = document.createElement("td");
        controlsRightTD.classList.add("extension-edit-controls-right");        // extension-edit-item > extension-edit-controls-right

        const editControlsDiv = document.createElement("div");
          editControlsDiv.classList.add("extension-controls-panel");           // extension-edit-item > extension-edit-controls-right > extension-controls-panel
          editControlsDiv.classList.add("edit-controls");                      // extension-edit-item > extension-edit-controls-right > edit-controls
          editControlsDiv.classList.add("extension-edit-controls");            // extension-edit-item > extension-list-controls-right > extension-edit-controls

          const cancelButton = document.createElement("button");
            cancelButton.classList.add("extension-edit-button");               // extension-edit-item > extension-edit-controls-right > edit-controls > extension-edit-button
            cancelButton.classList.add("extension-icon-button");               // extension-edit-item > extension-edit-controls-right > edit-controls > extension-icon-button
            cancelButton.classList.add("extension-list-icon-button");          // extension-edit-item > extension-edit-controls-right > edit-controls > extension-list-icon-button
            cancelButton.classList.add("icon-only");                           // extension-edit-item > extension-edit-controls-right > edit-controls > icon-only
            cancelButton.setAttribute("id", "extension_edit_cancel");
            cancelButton.addEventListener("click", (e) => this.#extensionControlButtonClicked(e));
////////////cancelButton.setAttribute("title", this.#tooltip_button_edit_cancel); // #enterEditMode()  will take care of this
          editControlsDiv.appendChild(cancelButton);

          const editNoQuotaCheckSPAN = document.createElement("span");
            editNoQuotaCheckSPAN.classList.add("extension-check-span"); // extension-edit-item > extension-edit-controls-right > edit-controls > extension-check-span
            const editNoQuotaCheck = document.createElement("input");
              editNoQuotaCheck.setAttribute( "type",  "checkbox"                                        );
              editNoQuotaCheck.setAttribute( "id",    "extension_edit_check_no_quota"                   );
              editNoQuotaCheck.setAttribute( "title", this.#tooltip_checkbox_noQuota_enabled_unchecked );
              editNoQuotaCheck.classList.add( "extension-check" );                 // ... > edit-controls > extension-check-span > extension-check
              editNoQuotaCheck.classList.add( "extension-edit-check" );            // ... > edit-controls > extension-check-span > extension-edit-check
              editNoQuotaCheck.classList.add( "no-quota-check"       );            // ... > edit-controls > extension-check-span > no-quota-check
              editNoQuotaCheck.addEventListener("change", (e) => this.#extensionOptionCheckChanged(e), true); // <====== NOTE: event "capturing" phase
            editNoQuotaCheckSPAN.appendChild(editNoQuotaCheck);
            const editNoQuotaCheckLabel = document.createElement("label");
              editNoQuotaCheckLabel.setAttribute( "for",   "extension_edit_check_no_quota"                   );
              editNoQuotaCheckLabel.setAttribute( "title", this.#tooltip_checkbox_noQuota_enabled_unchecked );
              editNoQuotaCheckLabel.classList.add( "extension-check-label" );      // ... > edit-controls > extension-check-span > extension-check-label
              editNoQuotaCheckLabel.classList.add( "no-quota-check"        );      // ... > edit-controls > extension-check-span > no-quota-check
            editNoQuotaCheckSPAN.appendChild(editNoQuotaCheckLabel);
          editControlsDiv.appendChild(editNoQuotaCheckSPAN);

          const editLockCheckSPAN = document.createElement("span");
            editLockCheckSPAN.classList.add("extension-check-span"); // extension-edit-item > extension-edit-controls-right > edit-controls > extension-check-span
            const editLockCheck = document.createElement("input");
              editLockCheck.setAttribute( "type",  "checkbox"                                    );
              editLockCheck.setAttribute( "id",    "extension_edit_check_lock"                   );
              editLockCheck.setAttribute( "title", this.#tooltip_checkbox_lock_enabled_unchecked );
              editLockCheck.classList.add( "extension-check" );                 // ... > edit-controls > extension-check-span > extension-check
              editLockCheck.classList.add( "extension-edit-check" );            // ... > edit-controls > extension-check-span > extension-edit-check
              editLockCheck.classList.add( "lock-check"           );            // ... > edit-controls > extension-check-span > lock-check
              editLockCheck.addEventListener("change", (e) => this.#extensionOptionCheckChanged(e), true); // <====== NOTE: event "capturing" phase
            editLockCheckSPAN.appendChild(editLockCheck);
            const editLockCheckLabel = document.createElement("label");
              editLockCheckLabel.setAttribute( "for",   "extension_edit_check_lock"                   );
              editLockCheckLabel.setAttribute( "title", this.#tooltip_checkbox_lock_enabled_unchecked );
              editLockCheckLabel.classList.add( "extension-check-label" );      // ... > edit-controls > extension-check-span > extension-check-label
              editLockCheckLabel.classList.add( "lock-check"            );      // ... > edit-controls > extension-check-span > lock-check
            editLockCheckSPAN.appendChild(editLockCheckLabel);
          editControlsDiv.appendChild(editLockCheckSPAN);

          const editDirProtectCheckSPAN = document.createElement("span");
            editDirProtectCheckSPAN.classList.add("extension-check-span"); // extension-edit-item > extension-edit-controls-right > edit-controls > extension-check-span
            const editDirProtectCheck = document.createElement("input");
              editDirProtectCheck.setAttribute( "type",  "checkbox"                                           );
              editDirProtectCheck.setAttribute( "id",    "extension_edit_check_dir_protect"                   );
              editDirProtectCheck.setAttribute( "title", this.#tooltip_checkbox_dirProtect_enabled_unchecked );
              editDirProtectCheck.classList.add( "extension-check" );            // ... > edit-controls > extension-check-span > extension-check
              editDirProtectCheck.classList.add( "extension-edit-check" );       // ... > edit-controls > extension-check-span > extension-edit-check
              editDirProtectCheck.classList.add( "dir-protect-check"    );       // ... > edit-controls > extension-check-span > dir-protect-check
              editDirProtectCheck.addEventListener("change", (e) => this.#extensionOptionCheckChanged(e), true); // <====== NOTE: event "capturing" phase
            editDirProtectCheckSPAN.appendChild(editDirProtectCheck);
            const editDirProtectCheckLabel = document.createElement("label");
              editDirProtectCheckLabel.setAttribute( "for",   "extension_edit_check_dir_protect"                   );
              editDirProtectCheckLabel.setAttribute( "title", this.#tooltip_checkbox_dirProtect_enabled_unchecked );
              editDirProtectCheckLabel.classList.add( "extension-check-label" ); // ... > edit-controls > extension-check-span > extension-check-label
              editDirProtectCheckLabel.classList.add( "dir-protect-check"     ); // ... > edit-controls > extension-check-span > dir-protect-check
            editDirProtectCheckSPAN.appendChild(editDirProtectCheckLabel);
          editControlsDiv.appendChild(editDirProtectCheckSPAN);

          const editReadOnlyCheckSPAN = document.createElement("span");
            editReadOnlyCheckSPAN.classList.add("extension-check-span"); // extension-edit-item > extension-edit-controls-right > edit-controls > extension-check-span
            const editReadOnlyCheck = document.createElement("input");
              editReadOnlyCheck.setAttribute( "type",  "checkbox"                                        );
              editReadOnlyCheck.setAttribute( "id",    "extension_edit_check_read_only"                  );
//////////////editReadOnlyCheck.setAttribute( "title", this.#tooltip_checkbox_readOnly_enabled_unchecked ); // #enterEditMode()  will take care of this
              editReadOnlyCheck.classList.add( "extension-check" );            // ... > edit-controls > extension-check-span > extension-check
              editReadOnlyCheck.classList.add( "extension-edit-check" );       // ... > edit-controls > extension-check-span > extension-edit-check
              editReadOnlyCheck.classList.add( "read-only-check"      );       // ... > edit-controls > extension-check-span > read-only-check
              editReadOnlyCheck.addEventListener("change", (e) => this.#extensionOptionCheckChanged(e), true); // <====== NOTE: event "capturing" phase
            editReadOnlyCheckSPAN.appendChild(editReadOnlyCheck);
            const editReadOnlyCheckLabel = document.createElement("label");
              editReadOnlyCheckLabel.setAttribute( "for",   "extension_edit_check_read_only"                  );
//////////////editReadOnlyCheckLabel.setAttribute( "title", this.#tooltip_checkbox_readOnly_enabled_unchecked ); // #enterEditMode()  will take care of this
              editReadOnlyCheckLabel.classList.add( "extension-check-label" ); // ... > edit-controls > extension-check-span > extension-check-label
              editReadOnlyCheckLabel.classList.add( "read-only-check"       ); // ... > edit-controls > extension-check-span > read-only-check
            editReadOnlyCheckSPAN.appendChild(editReadOnlyCheckLabel);
          editControlsDiv.appendChild(editReadOnlyCheckSPAN);

          const saveButton = document.createElement("button");
            saveButton.classList.add("extension-edit-button");               // extension-edit-item > extension-edit-controls-right > edit-controls > extension-edit-button
            saveButton.classList.add("extension-icon-button");               // extension-edit-item > extension-edit-controls-right > edit-controls > extension-icon-button
            saveButton.classList.add("extension-list-icon-button");          // extension-edit-item > extension-edit-controls-right > edit-controls > extension-list-icon-button
            saveButton.classList.add("icon-only");                           // extension-edit-item > extension-edit-controls-right > edit-controls > icon-only
            saveButton.setAttribute("id", "extension_edit_save");
            saveButton.addEventListener("click", (e) => this.#extensionControlButtonClicked(e));
////////////saveButton.setAttribute("title", this.#tooltip_button_edit_save); // #enterEditMode()  will take care of this
            // this.#tooltip_button_edit_add ???
          editControlsDiv.appendChild(saveButton);
        controlsRightTD.appendChild(editControlsDiv);
      extensionEditTR.appendChild(controlsRightTD);

    return extensionEditTR;
  }



  #buildExtensionEditErrorItemUI() {
    const extensionEditErrorTR = document.createElement("tr");
      extensionEditErrorTR.setAttribute("id", "extension_edit_error");
      extensionEditErrorTR.classList.add("extension-edit-error-item");                 // extension-edit-error_item
      extensionEditErrorTR.classList.add('display-none');                              // HIDE the Row - turn ON display: none

      // Create space for the allow-access-check checkbox column TD and add it to the row
      const extensionEditErrorLeftLeftTD = document.createElement("td");
        extensionEditErrorLeftLeftTD.classList.add("extension-edit-error-left");       // extension-edit-error-item > extension-edit-error-left
      extensionEditErrorTR.appendChild(extensionEditErrorLeftLeftTD);

      //
      const extensionEditErrorControlsLeftTD = document.createElement("td");
        extensionEditErrorControlsLeftTD.setAttribute("colspan", "2");
        extensionEditErrorControlsLeftTD.classList.add("extension-edit-error-controls-left");
        const editErrorDismissButton = document.createElement("button");
          editErrorDismissButton.setAttribute("id", "extension_edit_error_dismiss");
          editErrorDismissButton.classList.add("extension-edit-error-button");// extension-edit-error-item > extension-edit-error-controls-left > extension-edit-error-button
          editErrorDismissButton.classList.add("extension-icon-button");      // extension-edit-error-item > extension-edit-error-controls-left > extension-icon-button
          editErrorDismissButton.classList.add("icon-only");                  // extension-edit-error-item > extension-edit-error-controls-left > icon-only
          editErrorDismissButton.classList.add("no-css");                     // extension-edit-error-item > extension-edit-error-controls-left > no-css
          editErrorDismissButton.classList.add("edit-error-dismiss");         // extension-edit-error-item > extension-edit-error-controls-left > edit-error-dismiss
          editErrorDismissButton.addEventListener("click", (e) => this.#extensionControlButtonClicked(e));
          editErrorDismissButton.setAttribute("title", this.#tooltip_button_edit_error_dismiss);
        extensionEditErrorControlsLeftTD.appendChild(editErrorDismissButton);
      extensionEditErrorTR.appendChild(extensionEditErrorControlsLeftTD);

      // Create Extension Name Error element and add it to the row
      const extensionNameTD = document.createElement("td");
        extensionNameTD.classList.add("extension-edit-error-data");                 // extension-edit-error-item > extension-edit-error-data
        const extensionNameErrorLabel = document.createElement("label");
          extensionNameErrorLabel.classList.add("extension-edit-error-label");
          extensionNameErrorLabel.setAttribute("id", "extension_edit_error_name");  // extension-edit-error-item > extension-edit-error-data > extension_edit_name
        extensionNameTD.appendChild(extensionNameErrorLabel);
      extensionEditErrorTR.appendChild(extensionNameTD);

      // Create Extension Id Error element and add it to the row
      const extensionIdTD = document.createElement("td");
        extensionIdTD.classList.add("extension-edit-error-data");                   // extension-edit-error-item > extension-edit-error-data
        const extensionIdErrorLabel = document.createElement("label");
          extensionIdErrorLabel.classList.add("extension-edit-error-label");
          extensionIdErrorLabel.setAttribute("id", "extension_edit_error_id");      // extension-edit-error-item > extension-edit-error-data > extension_edit_error_id
        extensionIdTD.appendChild(extensionIdErrorLabel);
      extensionEditErrorTR.appendChild(extensionIdTD);

      if (this.#SHOW_EXTENSION_STATS) {
        const extensionStatsTD = document.createElement("td");
          extensionStatsTD.classList.add("extension-edit-error-data");             // extension-edit-error-item > extension-edit-error-data
          extensionStatsTD.setAttribute("colspan", this.#EXTENSION_STATS_COL_SPAN.toString());
        extensionEditErrorTR.appendChild(extensionStatsTD);
      }

      // Create controls-right element and add it to the row
      const emptyRightTD = document.createElement("td");
        emptyRightTD.classList.add("extension-edit-error-empty");                   // extension-edit-error-item > extension-edit-error-empty
      extensionEditErrorTR.appendChild(emptyRightTD);

    return extensionEditErrorTR;
  }



  // async just because of formatFileSize()
  async #buildExtensionListItemUI(extensionId, props, extDirStats, extInfo) {
    const installed      = extInfo ? true                : false;
    const extensionName  =                                                         ( ( ! props || (typeof props.name        ) !== 'string'  ) ? ''    : props.name         );
    const description    = extInfo ? extInfo.description :                         ( ( ! props || (typeof props.description ) !== 'string'  ) ? ''    : props.description  );
    const disabled       = extInfo ? ! extInfo.enabled   :                         ( ( ! props || (typeof props.disabled    ) !== 'boolean' ) ? false : props.disabled     );
    const extIdFromProps =                                                         ( ( ! props || (typeof props.id          ) !== 'string'  ) ? ''    : props.id           );
    const special        =                                                         ( ( ! props || (typeof props.special     ) !== 'boolean' ) ? false : props.special      );
    const locked         = /* special forces this */   special                  || ( ( ! props || (typeof props.locked      ) !== 'boolean' ) ? false : props.locked       );
    const dirProtect     = /* special forces this */   special                  || ( ( ! props || (typeof props.dirProtect  ) !== 'boolean' ) ? false : props.dirProtect   );
    const noQuota        = /* special forces this */   special                  || ( ( ! props || (typeof props.noQuota     ) !== 'boolean' ) ? false : props.noQuota      );
    const allowAccess    = /* special forces this */   special                  || ( ( ! props || (typeof props.allowAccess ) !== 'boolean' ) ? true  : props.allowAccess  );
    const readOnly       = /* special forces this */   ! special && allowAccess && ( ( ! props || (typeof props.readOnly    ) !== 'boolean' ) ? false : props.readOnly     );

    if (this.#DEBUG) {
      this.debugAlways("\n--- PROPS:\n", props, "\n\n");

      this.debugAlways( "\n--- BUILD LIST ITEM UI:",
                        `\n- extensionId ......... "${extensionId}"`,
                        `\n- props.id ............ "${props.id}"`,
                        `\n- props.name .......... "${props.name}"`,
                        `\n- props.description ... "${props.description}"`,
                        `\n- installed ........... ${installed}`,
                        `\n- disabled ............ ${disabled}`,
                        `\n- special ............. ${special}`,
                        `\n- locked .............. ${locked}`,
                        `\n- dirProtect .......... ${dirProtect}`,
                        `\n- noQuota ............. ${noQuota}`,
                        `\n- allowAccess ......... ${allowAccess}`,
                        `\n- readOnly ............ ${readOnly}`,
                      );
    }

    if (extIdFromProps !== extensionId) {
      this.error(`-- EXTENSION ID MISMATCH -- extensionId="${extensionId}" extIdFromProps="${extIdFromProps}"`);
    }

    if (extInfo && extInfo.id !== extensionId) {
      this.error(`-- EXTENSION ID MISMATCH -- extensionId="${extensionId}" extInfo.id="${extInfo.id}"`);
    }

    const extensionTR = document.createElement("tr");
                                      extensionTR.classList.add( "extension-list-item"   );  // extension-list-item
      if (installed)                  extensionTR.classList.add( "extension-installed"   );
      if (disabled)                   extensionTR.classList.add( "extension-disabled"    );
      if (special)                    extensionTR.classList.add( "extension-special"     );
      if (locked)                     extensionTR.classList.add( "extension-locked"      ); // (special forces locked)
      if (dirProtect)                 extensionTR.classList.add( "extension-dir-protect" ); // (special forces dirProtect)
      if (noQuota)                    extensionTR.classList.add( "extension-no-quota"    ); // (special forces noQuota)
      if (! allowAccess && ! special) extensionTR.classList.add( "access-disallowed"     ); // (special forces allowAccess, BTW, but WTF?)
      if (readOnly      && ! special) extensionTR.classList.add( "extension-read-only"   ); // readOnly requires allowAccess (and also NOT special)

      extensionTR.setAttribute( "extensionId",   extensionId   );
      extensionTR.setAttribute( "extensionName", extensionName );


      // locked extensions need event listeners in case they become unlocked
      extensionTR.addEventListener("click",    (e) => this.#extensionClicked(e),       true); // <====== NOTE: true: event "capturing" phase
      extensionTR.addEventListener("dblclick", (e) => this.#extensionDoubleClicked(e), true); // <====== NOTE: true: event "capturing" phase

      // Create allow-access-check checkbox inside a TD and add it to the row
      const controlsLeftTD = document.createElement("td");
        controlsLeftTD.classList.add("extension-list-controls-left");   // extension-list-item > extension-list-controls-left

        const allowAccessCheck = document.createElement("input");
          const allowAccessCheckId = "allowAccessCheck_" + extensionId;
          allowAccessCheck.setAttribute( "type",        "checkbox"         );
          allowAccessCheck.setAttribute( "id",          allowAccessCheckId );
          allowAccessCheck.setAttribute( "extensionId", extensionId        );
          allowAccessCheck.classList.add("extension-check");       // extension-list-item > extension-list-controls-left > extension-check
          allowAccessCheck.classList.add("allow-access-check");    // extension-list-item > extension-list-controls-left > allow-access-check
          allowAccessCheck.addEventListener("change", (e) => this.#extensionOptionCheckChanged(e), true); // <====== NOTE: event "capturing" phase
          if (special) {
            allowAccessCheck.checked = true;
            allowAccessCheck.disabled = true;
            allowAccessCheck.setAttribute("title", this.#tooltip_checkbox_allowAccess_disabled_special);
          } else if (locked) {
            allowAccessCheck.checked = allowAccess;
            allowAccessCheck.disabled = true;
            allowAccessCheck.setAttribute("title", this.#tooltip_checkbox_allowAccess_disabled_locked);
          } else {
            allowAccessCheck.checked = allowAccess;
            allowAccessCheck.disabled = false;
            if (allowAccess) {
              allowAccessCheck.setAttribute("title", this.#tooltip_checkbox_allowAccess_enabled_checked);
              // eventually there will be a label as well
            } else {
              allowAccessCheck.setAttribute("title", this.#tooltip_checkbox_allowAccess_enabled_unchecked);
              // eventually there will be a label as well
            }
          }
          //
        controlsLeftTD.appendChild(allowAccessCheck);
      extensionTR.appendChild(controlsLeftTD);

      // Create Extension Installed element and add it to the row
      const extensionInstalledTD = document.createElement("td");
        extensionInstalledTD.classList.add("extension-list-data");             // extension-list-item > extension-list-data
        extensionInstalledTD.classList.add("data-boolean");                    // extension-list-item > data-boolean
        extensionInstalledTD.classList.add("extension-list-installed");        // extension-list-item > extension-list-installed
        const extensionInstalledDotSpan = document.createElement("span");
          extensionInstalledDotSpan.classList.add("data-boolean-dot");         // extension-list-item > extension-list-data > data-boolean-dot
          if (installed) {
            extensionInstalledDotSpan.classList.add("dot-ext-installed");      // extension-list-item > extension-list-data > dot-ext-installed
            if (this.#tooltip_dot_extension_installed) extensionInstalledDotSpan.setAttribute("title", this.#tooltip_dot_extension_installed);
          } else {
            extensionInstalledDotSpan.classList.add("dot-ext-not-installed");  // extension-list-item > extension-list-data > dot-ext-not-installed
            if (this.#tooltip_dot_extension_not_installed) extensionInstalledDotSpan.setAttribute("title", this.#tooltip_dot_extension_not_installed);
          }
        extensionInstalledTD.appendChild(extensionInstalledDotSpan);
      extensionTR.appendChild(extensionInstalledTD);

      // Create Extension Enabled element and add it to the row
      const extensionEnabledTD = document.createElement("td");
        extensionEnabledTD.classList.add("extension-list-data");                         // extension-list-item > extension-list-data
        extensionEnabledTD.classList.add("data-boolean");                                // extension-list-item > data-boolean
        extensionEnabledTD.classList.add("extension-list-enabled");                      // extension-list-item > extension-list-enabled
        const extensionEnabledDotSpan = document.createElement("td");
          extensionEnabledDotSpan.classList.add("data-boolean-dot");                     // extension-list-item > extension-list-data > data-boolean-dot
          if (installed) {
            if (disabled) {
              extensionEnabledDotSpan.classList.add("dot-ext-disabled");                 // extension-list-item > extension-list-data > dot-ext-disabled
              if (this.#tooltip_dot_extension_disabled) extensionEnabledDotSpan.setAttribute("title", this.#tooltip_dot_extension_disabled);
            } else {
              extensionEnabledDotSpan.classList.add("dot-ext-enabled");                  // extension-list-item > extension-list-data > dot-ext-enabled
              if (this.#tooltip_dot_extension_enabled) extensionEnabledDotSpan.setAttribute("title", this.#tooltip_dot_extension_enabled);
            }
          } else {
            extensionEnabledDotSpan.classList.add("dot-ext-not-enabled-not-installed");  // extension-list-item > extension-list-data > dot-ext-not-enabled-not-installed
            if (this.#tooltip_dot_extension_not_installed) extensionEnabledDotSpan.setAttribute("title", this.#tooltip_dot_extension_not_installed);
          }
        extensionEnabledTD.appendChild(extensionEnabledDotSpan);
      extensionTR.appendChild(extensionEnabledTD);

      // Create Extension Name element and add it to the row
      const extensionNameTD = document.createElement("td");
        extensionNameTD.classList.add("extension-list-data");                            // extension-list-item > extension-list-data
        extensionNameTD.classList.add("data-text");                                      // extension-list-item > data-text
        extensionNameTD.classList.add("extension-list-name");                            // extension-list-item > extension-list-name
        if (description) extensionNameTD.setAttribute("title", description);
        const extensionNameTextSpan = document.createElement("span");
          extensionNameTextSpan.classList.add("extension-list-name-text");               // extension-list-item > extension-list-data> extension-list-name-text
          extensionNameTextSpan.appendChild( document.createTextNode(extensionName) );
        extensionNameTD.appendChild(extensionNameTextSpan);

        const extensionMarkersSpan = document.createElement("span");
          extensionMarkersSpan.classList.add("extension-markers");                           // extension-list-item > extension-list-data > extension-markers
          // SPECIAL EXTENSION Marker
          const extensionMarkerSpecialSpan = document.createElement("span");
            extensionMarkerSpecialSpan.classList.add("extension-marker");                    // ... > extension-list-data > extension-markers > extension-marker
            extensionMarkerSpecialSpan.classList.add("marker-special");                      // ... > extension-list-data > extension-markers > marker-special
            extensionMarkerSpecialSpan.setAttribute("title", this.#extensionList_marker_tooltip_special);
          extensionMarkersSpan.appendChild(extensionMarkerSpecialSpan);
          // NO QUOTA Marker
          const extensionMarkerNoQuotaSpan = document.createElement("span");
            extensionMarkerNoQuotaSpan.classList.add("extension-marker");                    // ... > extension-list-data > extension-markers > extension-marker
            extensionMarkerNoQuotaSpan.classList.add("marker-no-quota");                     // ... > extension-list-data > extension-markers > marker-no-quota
            if (special) {
              extensionMarkerNoQuotaSpan.setAttribute("title", this.#extensionList_marker_tooltip_noQuotasSpecial);
            } else if (noQuota) {
              extensionMarkerNoQuotaSpan.setAttribute("title", this.#extensionList_marker_tooltip_quotasDisabled);
            } else {
              extensionMarkerNoQuotaSpan.setAttribute("title", this.#extensionList_marker_tooltip_quotasEnabled);
            }
          extensionMarkersSpan.appendChild(extensionMarkerNoQuotaSpan);
          // LOCKED Marker
          const extensionMarkerLockedSpan = document.createElement("span");
            extensionMarkerLockedSpan.classList.add("extension-marker");                    // ... > extension-list-data > extension-markers > extension-marker
            extensionMarkerLockedSpan.classList.add("marker-locked");                       // ... > extension-list-data > extension-markers > marker-locked
            extensionMarkerLockedSpan.setAttribute("title", this.#extensionList_marker_tooltip_locked);
          extensionMarkersSpan.appendChild(extensionMarkerLockedSpan);
          // DIR-PROTECTED Marker
          const extensionMarkerDirProtectSpan = document.createElement("span");
            extensionMarkerDirProtectSpan.classList.add("extension-marker");              // ... > extension-list-data > extension-markers > extension-marker
            extensionMarkerDirProtectSpan.classList.add("marker-dir-protect");            // ... > extension-list-data > extension-markers > marker-dir-protect
            extensionMarkerDirProtectSpan.setAttribute("title", this.#extensionList_marker_tooltip_dirProtect);
          extensionMarkersSpan.appendChild(extensionMarkerDirProtectSpan);
          // ACCESS-DISALLOWED Marker
          const extensionMarkerAccessDisallowedSpan = document.createElement("span");
            extensionMarkerAccessDisallowedSpan.classList.add("extension-marker");          // ... > extension-list-data > extension-markers > extension-marker
            extensionMarkerAccessDisallowedSpan.classList.add("marker-access-disallowed");  // ... > extension-list-data > extension-markers > marker-access-disallowed
            extensionMarkerAccessDisallowedSpan.setAttribute("title", this.#extensionList_marker_tooltip_accessDisallowed);
          extensionMarkersSpan.appendChild(extensionMarkerAccessDisallowedSpan);
        extensionNameTD.appendChild(extensionMarkersSpan);

      extensionTR.appendChild(extensionNameTD);

      // Create Extension Id element and add it to the row
      const extensionIdTD = document.createElement("td");
        extensionIdTD.classList.add("extension-list-data");                          // extension-list-item > extension-list-data
        extensionIdTD.classList.add("data-text");                                    // extension-list-item > data-text
        extensionIdTD.classList.add("extension-list-id");                            // extension-list-item > extension-list-id
        if (description) extensionIdTD.setAttribute("title", description);
        extensionIdTD.appendChild( document.createTextNode(extensionId) );
      extensionTR.appendChild(extensionIdTD);

      if (this.#SHOW_EXTENSION_STATS) {

        // Create Extension DirectoryExists element and add it to the row
        const extensionDirExistsTD = document.createElement("td");
          extensionDirExistsTD.classList.add("extension-list-data");                 // extension-list-item > extension-list-data
          extensionDirExistsTD.classList.add("data-boolean");                        // extension-list-item > data-boolean
          extensionDirExistsTD.classList.add("extension-list-stats-dir-exists");     // extension-list-item > extension-list-stats-dir-exists

          const extensionDirExistsDotSpan = document.createElement("td");
            extensionDirExistsDotSpan.classList.add("data-boolean-dot");             // extension-list-item > extension-list-data > data-boolean-dot
            if (extDirStats) {
              extensionDirExistsDotSpan.classList.add("dot-stats-dir-exists");       // extension-list-item > extension-list-data > dot-stats-dir-exists
              if (this.#tooltip_stats_dot_directory_found) extensionDirExistsDotSpan.setAttribute("title", this.#tooltip_stats_dot_directory_found);
            } else {
              extensionDirExistsDotSpan.classList.add("dot-stats-not-dir-exists");   // extension-list-item > extension-list-data > dot-stats-not-dir-exists
              if (this.#tooltip_stats_dot_directory_not_found) extensionDirExistsDotSpan.setAttribute("title", this.#tooltip_stats_dot_directory_not_found);
            }
          extensionDirExistsTD.appendChild(extensionDirExistsDotSpan);
        extensionTR.appendChild(extensionDirExistsTD);

        // Create Extension TotalSize (formatted) element and add it to the row
        const extensionItemCountTD = document.createElement("td");
          extensionItemCountTD.classList.add("extension-list-data");             // extension-list-item > extension-list-data
          extensionItemCountTD.classList.add("data-numeric");                    // extension-list-item > data-numeric
          extensionItemCountTD.classList.add("extension-list-stats-item-count"); // extension-list-item > extension-list-stats-item-count
          if (extDirStats) {
            extensionItemCountTD.appendChild( document.createTextNode( extDirStats.count_children.toString() ) );
            if (this.#tooltip_stats_item_count) extensionItemCountTD.setAttribute("title", this.#tooltip_stats_item_count);
          } else {
            extensionItemCountTD.appendChild( document.createTextNode("-") );
            if (this.#tooltip_stats_directory_not_found) extensionItemCountTD.setAttribute("title", this.#tooltip_stats_directory_not_found);
          }
        extensionTR.appendChild(extensionItemCountTD);

        // Create Extension TotalSize (formatted) element and add it to the row
        const extensionTotalSizeFmtTD = document.createElement("td");
          extensionTotalSizeFmtTD.classList.add("extension-list-data");                 // extension-list-item > extension-list-data
          extensionTotalSizeFmtTD.classList.add("data-numeric");                        // extension-list-item > data-numeric
          extensionTotalSizeFmtTD.classList.add("extension-list-stats-total-size-fmt"); // extension-list-item > extension-list-stats-total-size-fmt
          if (extDirStats) {
            extensionTotalSizeFmtTD.appendChild( document.createTextNode( await messenger.messengerUtilities.formatFileSize( extDirStats.size_total ) ) );
            if (this.#tooltip_stats_total_size_formatted) extensionTotalSizeFmtTD.setAttribute("title", this.#tooltip_stats_total_size_formatted);
          } else {
            extensionTotalSizeFmtTD.appendChild( document.createTextNode("-") );
            if (this.#tooltip_stats_directory_not_found) extensionTotalSizeFmtTD.setAttribute("title", this.#tooltip_stats_directory_not_found);
          }
        extensionTR.appendChild(extensionTotalSizeFmtTD);

        // Create Extension TotalSize (in bytes) element and add it to the row
        const extensionTotalSizeBytesTD = document.createElement("td");
          extensionTotalSizeBytesTD.classList.add("extension-list-data");                   // extension-list-item > extension-list-data
          extensionTotalSizeBytesTD.classList.add("data-numeric");                          // extension-list-item > data-numeric
          extensionTotalSizeBytesTD.classList.add("extension-list-stats-total-size-bytes"); // extension-list-item > extension-list-stats-total-size-bytes
          if (extDirStats) {
            extensionTotalSizeBytesTD.appendChild( document.createTextNode( extDirStats.size_total.toString() ) );
            if (this.#tooltip_stats_total_size_bytes) extensionTotalSizeBytesTD.setAttribute("title", this.#tooltip_stats_total_size_bytes);
          } else {
            extensionTotalSizeBytesTD.appendChild( document.createTextNode("-") );
            if (this.#tooltip_stats_directory_not_found) extensionTotalSizeBytesTD.setAttribute("title", this.#tooltip_stats_directory_not_found);
          }
        extensionTR.appendChild(extensionTotalSizeBytesTD);
      }

      // Create controls-right element and add it to the row
      const controlsRightTD = document.createElement("td");
        controlsRightTD.classList.add("extension-list-controls-right"); // extension-list-item > extension-list-controls-right

        const editControlsDiv = document.createElement("div");
          editControlsDiv.classList.add( "extension-controls-panel" ); // extension-list-item > extension-list-controls-right > extension-controls-panel
          editControlsDiv.classList.add( "edit-controls"            ); // extension-list-item > extension-list-controls-right > edit-controls
          editControlsDiv.classList.add( "extension-edit-controls"  ); // extension-list-item > extension-list-controls-right > extension-edit-controls

          const editButton = document.createElement("button");
            editButton.classList.add( "extension-list-button"      ); // extension-list-item > extension-list-controls-right > extension-edit-controls > extension-list-button
            editButton.classList.add( "extension-icon-button"      ); // extension-list-item > extension-list-controls-right > extension-edit-controls > extension-icon-button
            editButton.classList.add( "extension-list-icon-button" ); // extension-list-item > extension-list-controls-right > extension-edit-controls > extension-list-icon-button
            editButton.classList.add( "icon-only"                  ); // extension-list-item > extension-list-controls-right > extension-edit-controls > icon-only
            editButton.classList.add( "edit-extension"             ); // extension-list-item > extension-list-controls-right > extension-edit-controls > edit-extension
            editButton.setAttribute("extensionId", extensionId);
            editButton.addEventListener("click", (e) => this.#extensionControlButtonClicked(e));
            if (special) {
              editButton.disabled = true;
              editButton.setAttribute("title", this.#tooltip_button_edit_disabled_special);
            } else if (locked) {
              editButton.disabled = true;
              editButton.setAttribute("title", this.#tooltip_button_edit_disabled_locked);
            } else {
              editButton.disabled = false;
              editButton.setAttribute("title", this.#tooltip_button_edit_enabled);
            }
          editControlsDiv.appendChild(editButton);

          const noQuotaCheckSPAN = document.createElement("span");
            noQuotaCheckSPAN.classList.add( "extension-check-span"     ); // ... > extension-list-controls-right > extension-edit-controls > extension-check-span
            noQuotaCheckSPAN.classList.add( "extension-check-no-quota" ); // ... > extension-list-controls-right > extension-edit-controls > extension-check-no-quota
            const noQuotaCheck = document.createElement("input");
              const noQuotaCheckId = "noQuotaCheck_" + extensionId;
              noQuotaCheck.setAttribute( "type",        "checkbox"  );
              noQuotaCheck.setAttribute( "id",          noQuotaCheckId );
              noQuotaCheck.setAttribute( "extensionId", extensionId );
              noQuotaCheck.classList.add( "extension-check" );                // ... > extension-edit-controls > extension-check-span > extension-check
              noQuotaCheck.classList.add( "no-quota-check"  );                // ... > extension-edit-controls > extension-check-span > no-quota-check
              noQuotaCheck.addEventListener("change", (e) => this.#extensionOptionCheckChanged(e), true); // <====== NOTE: event "capturing" phase
            noQuotaCheckSPAN.appendChild(noQuotaCheck);
            const noQuotaCheckLabel = document.createElement("label");
              noQuotaCheckLabel.setAttribute( "for",         noQuotaCheckId );
              noQuotaCheckLabel.setAttribute( "extensionId", extensionId );
              noQuotaCheckLabel.classList.add( "extension-check-label") ;     // ... > extension-edit-controls > extension-check-span > extension-check-label
              noQuotaCheckLabel.classList.add( "no-quota-check"        );     // ... > extension-edit-controls > extension-check-span > no-quota-check
            noQuotaCheckSPAN.appendChild(noQuotaCheckLabel);
            if (special) {
              noQuotaCheck.checked  = true;
              noQuotaCheck.disabled = true;
              noQuotaCheck.setAttribute(      "title", this.#tooltip_checkbox_noQuota_disabled_special );
              noQuotaCheckLabel.setAttribute( "title", this.#tooltip_checkbox_noQuota_disabled_special );
            } else {
              noQuotaCheck.checked  = noQuota;
              if (locked) {
                noQuotaCheck.disabled = true;
                noQuotaCheck.setAttribute(      "title", this.#tooltip_checkbox_noQuota_disabled_locked );
                noQuotaCheckLabel.setAttribute( "title", this.#tooltip_checkbox_noQuota_disabled_locked );
              } else {
                noQuotaCheck.disabled = false;
                if (noQuota) {
                  noQuotaCheck.setAttribute(      "title", this.#tooltip_checkbox_noQuota_enabled_checked );
                  noQuotaCheckLabel.setAttribute( "title", this.#tooltip_checkbox_noQuota_enabled_checked );
                } else {
                  noQuotaCheck.setAttribute(      "title", this.#tooltip_checkbox_noQuota_enabled_unchecked );
                  noQuotaCheckLabel.setAttribute( "title", this.#tooltip_checkbox_noQuota_enabled_unchecked );
                }
              }
            }
          editControlsDiv.appendChild(noQuotaCheckSPAN);

          const lockCheckSPAN = document.createElement("span");
            lockCheckSPAN.classList.add( "extension-check-span" ); // ... > extension-list-controls-right > extension-edit-controls > extension-check-span
            lockCheckSPAN.classList.add( "extension-check-lock" ); // ... > extension-list-controls-right > extension-edit-controls > extension-check-lock
            const lockCheck = document.createElement("input");
              const lockCheckId = "lockCheck_" + extensionId;
              lockCheck.setAttribute( "type",        "checkbox"  );
              lockCheck.setAttribute( "id",          lockCheckId );
              lockCheck.setAttribute( "extensionId", extensionId );
              lockCheck.classList.add("extension-check");                  // ... > extension-edit-controls > extension-check-span > extension-check
              lockCheck.classList.add("lock-check");                            // ... > extension-edit-controls > extension-check-span > lock-check
              lockCheck.addEventListener("change", (e) => this.#extensionOptionCheckChanged(e), true); // <====== NOTE: event "capturing" phase
            lockCheckSPAN.appendChild(lockCheck);
            const lockCheckLabel = document.createElement("label");
              lockCheckLabel.setAttribute( "for",         lockCheckId );
              lockCheckLabel.setAttribute( "extensionId", extensionId );
              lockCheckLabel.classList.add("extension-check-label");       // ... > extension-edit-controls > extension-check-span > extension-check-label
              lockCheckLabel.classList.add("lock-check");                       // ... > extension-edit-controls > extension-check-span > lock-check
            lockCheckSPAN.appendChild(lockCheckLabel);
            if (special) {
              lockCheck.checked  = true;
              lockCheck.disabled = true;
              lockCheck.setAttribute(      "title", this.#tooltip_checkbox_lock_disabled_special );
              lockCheckLabel.setAttribute( "title", this.#tooltip_checkbox_lock_disabled_special );
            } else {
              lockCheck.checked  = locked;
              lockCheck.disabled = false;
              if (locked) {
                lockCheck.setAttribute(      "title", this.#tooltip_checkbox_lock_enabled_checked );
                lockCheckLabel.setAttribute( "title", this.#tooltip_checkbox_lock_enabled_checked );
              } else {
                lockCheck.setAttribute(      "title", this.#tooltip_checkbox_lock_enabled_unchecked );
                lockCheckLabel.setAttribute( "title", this.#tooltip_checkbox_lock_enabled_unchecked );
              }
            }
          editControlsDiv.appendChild(lockCheckSPAN);

          const dirProtectCheckSPAN = document.createElement("span");
            dirProtectCheckSPAN.classList.add( "extension-check-span"        ); // ... > extension-list-controls-right > extension-edit-controls > extension-check-span
            dirProtectCheckSPAN.classList.add( "extension-check-dir-protect" ); // ... > extension-list-controls-right > extension-edit-controls > extension-check-dir-protect
            const dirProtectCheck = document.createElement("input");
              const dirProtectCheckId = "dirProtectCheck_" + extensionId;
              dirProtectCheck.setAttribute( "type",        "checkbox"        );
              dirProtectCheck.setAttribute( "id",          dirProtectCheckId );
              dirProtectCheck.setAttribute( "extensionId", extensionId       );
              dirProtectCheck.classList.add("extension-check");            // ... > extension-edit-controls > extension-check-span > extension-check
              dirProtectCheck.classList.add("dir-protect-check");          // ... > extension-edit-controls > extension-check-span > dir-protect-check
              dirProtectCheck.addEventListener("change", (e) => this.#extensionOptionCheckChanged(e), true); // <====== NOTE: event "capturing" phase
            dirProtectCheckSPAN.appendChild(dirProtectCheck);
            const dirProtectCheckLabel = document.createElement("label");
              dirProtectCheckLabel.setAttribute( "for",         dirProtectCheckId );
              dirProtectCheckLabel.setAttribute( "extensionId", extensionId      );
              dirProtectCheckLabel.classList.add("extension-check-label"); // ... > extension-edit-controls > extension-check-span > extension-check-label
              dirProtectCheckLabel.classList.add("dir-protect-check");     // ... > extension-edit-controls > extension-check-span > dir-protect-check
            dirProtectCheckSPAN.appendChild(dirProtectCheckLabel);
            if (special) {
              dirProtectCheck.checked  = true;
              dirProtectCheck.disabled = true;
              dirProtectCheck.setAttribute(      "title", this.#tooltip_checkbox_dirProtect_disabled_special );
              dirProtectCheckLabel.setAttribute( "title", this.#tooltip_checkbox_dirProtect_disabled_special );
            } else {
              dirProtectCheck.checked = dirProtect;
              if (locked) {
                dirProtectCheck.disabled = true;
                dirProtectCheck.setAttribute(      "title", this.#tooltip_checkbox_dirProtect_disabled_locked );
                dirProtectCheckLabel.setAttribute( "title", this.#tooltip_checkbox_dirProtect_disabled_locked );
              } else {
                dirProtectCheck.disabled = false;
                if (dirProtect) {
                  dirProtectCheck.setAttribute(      "title", this.#tooltip_checkbox_dirProtect_enabled_checked );
                  dirProtectCheckLabel.setAttribute( "title", this.#tooltip_checkbox_dirProtect_enabled_checked );
                } else {
                  dirProtectCheck.setAttribute(      "title", this.#tooltip_checkbox_dirProtect_enabled_unchecked );
                  dirProtectCheckLabel.setAttribute( "title", this.#tooltip_checkbox_dirProtect_enabled_unchecked );
                }
              }
            }
          editControlsDiv.appendChild(dirProtectCheckSPAN);

          const readOnlyCheckSPAN = document.createElement("span");
            readOnlyCheckSPAN.classList.add( "extension-check-span"      ); // ... > extension-list-controls-right > extension-edit-controls > extension-check-span
            readOnlyCheckSPAN.classList.add( "extension-check-read-only" ); // ... > extension-list-controls-right > extension-edit-controls > extension-check-read-only
            const readOnlyCheck = document.createElement("input");
              const readOnlyCheckId = "readOnlyCheck_" + extensionId;
              readOnlyCheck.setAttribute( "type",        "checkbox"      );
              readOnlyCheck.setAttribute( "id",          readOnlyCheckId );
              readOnlyCheck.setAttribute( "extensionId", extensionId     );
              readOnlyCheck.classList.add( "extension-check" );             // ... > extension-edit-controls > extension-check-span > extension-check
              readOnlyCheck.classList.add( "read-only-check" );             // ... > extension-edit-controls > extension-check-span > read-only-check
              readOnlyCheck.addEventListener("change", (e) => this.#extensionOptionCheckChanged(e), true); // <====== NOTE: event "capturing" phase
            readOnlyCheckSPAN.appendChild(readOnlyCheck);
            const readOnlyCheckLabel = document.createElement("label");
              readOnlyCheckLabel.setAttribute( "for",         readOnlyCheckId );
              readOnlyCheckLabel.setAttribute( "extensionId", extensionId     );
              readOnlyCheckLabel.classList.add( "extension-check-label" );  // ... > extension-edit-controls > extension-check-span > extension-check-label
              readOnlyCheckLabel.classList.add( "read-only-check"       );  // ... > extension-edit-controls > extension-check-span > read-only-check
            readOnlyCheckSPAN.appendChild(readOnlyCheckLabel);
            if (special) {
              readOnlyCheck.checked  = false;
              readOnlyCheck.disabled = true;
              readOnlyCheck.setAttribute(      "title", this.#tooltip_checkbox_readOnly_disabled_special );
              readOnlyCheckLabel.setAttribute( "title", this.#tooltip_checkbox_readOnly_disabled_special );
            } else if (! allowAccess) {
              readOnlyCheck.checked  = false;
              readOnlyCheck.disabled = true;
              readOnlyCheck.setAttribute(      "title", this.#tooltip_checkbox_readOnly_disabled_accessDisallowed );
              readOnlyCheckLabel.setAttribute( "title", this.#tooltip_checkbox_readOnly_disabled_accessDisallowed );
            } else {
              readOnlyCheck.checked = readOnly;
              if (locked) {
                readOnlyCheck.disabled = true;
                readOnlyCheck.setAttribute(      "title", this.#tooltip_checkbox_readOnly_disabled_locked );
                readOnlyCheckLabel.setAttribute( "title", this.#tooltip_checkbox_readOnly_disabled_locked );
              } else {
                readOnlyCheck.disabled = false;
                if (readOnly) {
                  readOnlyCheck.setAttribute(      "title", this.#tooltip_checkbox_readOnly_enabled_checked );
                  readOnlyCheckLabel.setAttribute( "title", this.#tooltip_checkbox_readOnly_enabled_checked );
                } else {
                  readOnlyCheck.setAttribute(      "title", this.#tooltip_checkbox_readOnly_enabled_unchecked );
                  readOnlyCheckLabel.setAttribute( "title", this.#tooltip_checkbox_readOnly_enabled_unchecked );
                }
              }
            }
          editControlsDiv.appendChild(readOnlyCheckSPAN);

          const removeButton = document.createElement("button");
            removeButton.classList.add( "extension-list-button"      );// extension-list-item > extension-list-controls-right > extension-edit-controls > extension-list-button
            removeButton.classList.add( "extension-icon-button"      );// extension-list-item > extension-list-controls-right > extension-edit-controls > extension-icon-button
            removeButton.classList.add( "extension-list-icon-button" );// extension-list-item > extension-list-controls-right > extension-edit-controls > extension-list-icon-button
            removeButton.classList.add( "icon-only"                  );// extension-list-item > extension-list-controls-right > extension-edit-controls > icon-only
            removeButton.classList.add( "remove-extension"           );// extension-list-item > extension-list-controls-right > extension-edit-controls > remove-extension
            removeButton.setAttribute("extensionId", extensionId);
            removeButton.addEventListener("click", (e) => this.#extensionControlButtonClicked(e));
            if (special) {
              removeButton.disabled = true;
              removeButton.setAttribute("title", this.#tooltip_button_remove_disabled_special);
            } else if (locked) {
              removeButton.disabled = true;
              removeButton.setAttribute("title", this.#tooltip_button_remove_disabled_locked);
            } else {
              removeButton.disabled = false;
              removeButton.setAttribute("title", this.#tooltip_button_remove_enabled);
            }
          editControlsDiv.appendChild(removeButton);

        controlsRightTD.appendChild(editControlsDiv);
      extensionTR.appendChild(controlsRightTD);

    return extensionTR;
  }



  async #insertExtensionsListItemUI(extensionId, extensionProps) {
    if (this.#DEBUG) this.debugAlways( "\n--- INSERTING NEW EXTENSION ITEM INTO THE UI:",
                                       `\n- extensionId .................. "${extensionId}"`,
                                       `\n- extensionProps.id ............ "${extensionProps.id}"`,
                                       `\n- extensionProps.name .......... "${extensionProps.name}"`,
                                       `\n- extensionProps.locked ........ ${extensionProps.locked}`,
                                       `\n- extensionProps.dirProtect .... ${extensionProps.dirProtect}`,
                                       `\n- extensionProps.allowAccess ... ${extensionProps.allowAccess}`,
                                       `\n- extensionProps.readOnly ...... ${extensionProps.readOnly}`,
                                     );

    const extensionName = extensionProps.name;

    const domFsbExtensionList = document.getElementById("fsbExtensionList");

    const newExtensionTR = await this.#buildExtensionListItemUI(extensionId, extensionProps);

    var inserted = false;
    const domExtensionListItems = domFsbExtensionList.children;
    for (const domExtensionListItemTR of domExtensionListItems) {
      if (domExtensionListItemTR.classList.contains("extension-list-item")) {
        const domExtensionName = domExtensionListItemTR.getAttribute("extensionName");
        const compared         = domExtensionName.localeCompare(extensionName, { 'sensitity': 'base' } ); // COMPARE BY NAME
        this.debug(`-- extensionName="${extensionName}" domExtensionName="${domExtensionName}" compared=${compared}`);

        if (compared >= 0) {
          this.debug(`-- INSERTING extensionName="${extensionName}" BEFORE domExtensionName="${domExtensionName}"`);
          domFsbExtensionList.insertBefore(newExtensionTR, domExtensionListItemTR);
          inserted = true;
          break;
        }
      }
    }

    if (! inserted) {
      this.debug(`-- Insertion point not found -- Appending to end of list --  extensionId="${extensionId}"`);
      domFsbExtensionList.appendChild(newExtensionTR);
    }
  }



  async #updateExtensionsListItemUI(oldExtensionId, newExtensionId, extProps) {
    if (this.#DEBUG) this.debug( "\n--- #updateExtensionsListItemUI:",
                                 `\n- oldExtensionId ......... "${oldExtensionId}"`,
                                 `\n- newExtensionId ......... "${newExtensionId}"`,
                                 `\n- extProps.id ............ "${extProps.id}"`,
                                 `\n- extProps.name .......... "${extProps.name}"`,
                                 `\n- extProps.special ....... ${extProps.special}`,
                                 `\n- extProps.locked ........ ${extProps.locked}`,
                                 `\n- extProps.dirProtect .... ${extProps.dirProtect}`,
                                 `\n- extProps.allowAccess ... ${extProps.allowAccess}`,
                                 `\n- extProps.readOnly ...... ${extProps.readOnly}`,
                               );

    const domFsbExtensionList = document.getElementById("fsbExtensionList");
    const selectorTR          = `tr.extension-list-item[extensionId='${oldExtensionId}']`
    const extensionTR         = domFsbExtensionList.querySelector(selectorTR);

    var uiErrors = 0;
    if (! extensionTR) {
      this.debug(`-- QUERY FAILED TO GET EXTENSION ITEM TR -- selector="${selectorTR}"`);
      uiErrors++;

    } else {
      if (newExtensionId !== oldExtensionId) {
        // if IDs are NOT the same, delete old, insert new
        // MABXXX SHOULD WE DOUBLE-CHECK TO SEE IF newExtensionId ALREADY EXISTS???
        extensionTR.remove();
        await this.#insertExtensionsListItemUI(newExtensionId, extProps);

      } else {
        // else the IDs ARE the same, a "simple" update
        const selectorNameTextSPAN     = ".extension-list-name-text";
        const selectorIdTD             = ".extension-list-id";
        const selectorNoQuotaCheck     = `input.no-quota-check[type='checkbox'][extensionId='${oldExtensionId}']`
        const selectorLockCheck        = `input.lock-check[type='checkbox'][extensionId='${oldExtensionId}']`
        const selectorDirProtectCheck  = `input.dir-protect-check[type='checkbox'][extensionId='${oldExtensionId}']`
        const selectorAllowAccessCheck = `input.allow-access-check[type='checkbox'][extensionId='${oldExtensionId}']`
        const selectorReadOnlyCheck    = `input.read-only-check[type='checkbox'][extensionId='${oldExtensionId}']`
        const selectorEditButton       = `button.edit-extension[extensionId='${oldExtensionId}']`;
        const selectorRemoveButton     = `button.remove-extension[extensionId='${oldExtensionId}']`;

        const nameTextSPAN             = extensionTR.querySelector(selectorNameTextSPAN);
        const idTD                     = extensionTR.querySelector(selectorIdTD);
        const noQuotaCheck             = extensionTR.querySelector(selectorNoQuotaCheck);
        const lockCheck                = extensionTR.querySelector(selectorLockCheck);
        const dirProtectCheck          = extensionTR.querySelector(selectorDirProtectCheck);
        const allowAccessCheck         = extensionTR.querySelector(selectorAllowAccessCheck);
        const readOnlyCheck            = extensionTR.querySelector(selectorReadOnlyCheck);
        const editButton               = extensionTR.querySelector(selectorEditButton);
        const removeButton             = extensionTR.querySelector(selectorRemoveButton);



        if (! nameTextSPAN) {
          this.error(`-- QUERY FAILED TO GET EXTENSION ITEM Name Text SPAN -- selector="${selectorNameTextSPAN}"`);
          uiErrors++;
        }

        if (! idTD) {
          this.error(`-- QUERY FAILED TO GET EXTENSION ITEM ID <TD> ELEMENT -- selector="${selectorIdTD}"`);
          uiErrors++;
        }

        if (! noQuotaCheck) {
          this.error(`-- QUERY FAILED TO GET EXTENSION ITEM No Quota Check -- selector="${selectorNoQuotaCheck}"`);
          uiErrors++;
        }

        if (! lockCheck) {
          this.error(`-- QUERY FAILED TO GET EXTENSION ITEM Lock Check -- selector="${selectorLockCheck}"`);
          uiErrors++;
        }

        if (! dirProtectCheck) {
          this.error(`-- QUERY FAILED TO GET EXTENSION ITEM dirProtect Check -- selector="${selectorDirProtectCheck}"`);
          uiErrors++;
        }

        if (! allowAccessCheck) {
          this.error(`-- QUERY FAILED TO GET EXTENSION ITEM allowAccess Check -- selector="${selectorAllowAccessCheck}"`);
          uiErrors++;
        }

        if (! readOnlyCheck) {
          this.error(`-- QUERY FAILED TO GET EXTENSION ITEM readOnly Check -- selector="${selectorAllowAccessCheck}"`);
          uiErrors++;
        }

        if (! editButton) {
          this.error(`-- QUERY FAILED TO GET EXTENSION ITEM Edit Button -- selector="${selectorEditButton}"`);
          uiErrors++;
        }

        if (! removeButton) {
          this.error(`-- QUERY FAILED TO GET EXTENSION ITEM Remove Button -- selector="${selectorRemoveButton}"`);
          uiErrors++;
        }



        if (! uiErrors) {
          // deal with the classes on the extension-item
          if (extProps.special) {
            extensionTR.classList.add(    'extension-no-quota'    );
            extensionTR.classList.add(    'extension-locked'      );
            extensionTR.classList.add(    'extension-dir-protect' );
            extensionTR.classList.remove( 'access-disallowed'     );

          } else if (extProps.locked) {
            extensionTR.classList.add('extension-locked');

            if (extProps.noQuota) {
              extensionTR.classList.add('extension-no-quota');
            } else {
              extensionTR.classList.remove('extension-no-quota');
            }

            if (extProps.dirProtect) {
              extensionTR.classList.add('extension-dir-protect');
            } else {
              extensionTR.classList.remove('extension-dir-protect');
            }

            if (extProps.allowAccess) {
              extensionTR.classList.remove('access-disallowed');
              if (extProps.readOnly) {
                extensionTR.classList.add('extension-read-only');
              } else {
                extensionTR.classList.remove('extension-read-only');
              }
            } else {
              extensionTR.classList.add('access-disallowed');
              extensionTR.classList.remove('extension-read-only');
            }


          } else {
            extensionTR.classList.remove('extension-locked');

            if (extProps.noQuota) {
              extensionTR.classList.add('extension-no-quota');
            } else {
              extensionTR.classList.remove('extension-no-quota');
            }

            if (extProps.dirProtect) {
              extensionTR.classList.add('extension-dir-protect');
            } else {
              extensionTR.classList.remove('extension-dir-protect');
            }

            if (extProps.allowAccess) {
              extensionTR.classList.remove('access-disallowed');
              if (extProps.readOnly) {
                extensionTR.classList.add('extension-read-only');
              } else {
                extensionTR.classList.remove('extension-read-only');
              }
            } else {
              extensionTR.classList.add('access-disallowed');
              extensionTR.classList.remove('extension-read-only');
            }
          }



          // deal with the checkboxes
          if (extProps.special) {
            noQuotaCheck.checked      = true;
            noQuotaCheck.disabled     = true;

            lockCheck.checked         = true;
            lockCheck.disabled        = true;

            dirProtectCheck.checked   = true;
            dirProtectCheck.disabled  = true;

            allowAccessCheck.checked  = true;
            allowAccessCheck.disabled = true;

            readOnlyCheck.checked     = false;
            readOnlyCheck.disabled    = true;

          } else if (extProps.locked) {
            noQuotaCheck.checked      = extProps.noQuota;
            noQuotaCheck.disabled     = true;

            lockCheck.checked         = true; // of course it's checked ... the "if" condition says so
            lockCheck.disabled        = false;

            dirProtectCheck.checked   = extProps.dirProtect;
            dirProtectCheck.disabled  = true;

            allowAccessCheck.checked  = extProps.allowAccess;
            allowAccessCheck.disabled = true;

            if (extProps.allowAccess) {
              readOnlyCheck.checked   = extProps.readOnly;
            } else {
              readOnlyCheck.checked   = false;
            }
            readOnlyCheck.disabled  = true;

          } else {
            noQuotaCheck.checked      = extProps.noQuota;
            noQuotaCheck.disabled     = false;

            lockCheck.checked         = false; // of course it's not checked ... the "if" condition says so
            lockCheck.disabled        = false;

            dirProtectCheck.checked   = extProps.dirProtect;
            dirProtectCheck.disabled  = false;

            allowAccessCheck.checked  = extProps.allowAccess;
            allowAccessCheck.disabled = false;

            if (extProps.allowAccess) {
              readOnlyCheck.checked   = extProps.readOnly;
              readOnlyCheck.disabled  = false;
            } else {
              readOnlyCheck.checked   = false;
              readOnlyCheck.disabled  = true;
            }
          }



          // deal with the buttons
          if (extProps.special || extProps.locked) {
            editButton.disabled   = true;
            removeButton.disabled = true;
          } else {
            editButton.disabled   = false;
            removeButton.disabled = false;
          }



          // deal with the text
          nameTextSPAN.textContent = extProps.name;
          idTD.textContent         = extProps.id;
        }
      }
    }

    return uiErrors;
  }



  // Some input element on the Page was changed.
  //
  // Check to see if one of the Options checkboxes or radio buttons (etc) has been clicked or a select has changed
  //
  // NOTE: This listener is set on the DOCUMENT!!!
  async #optionChanged(e) {
    if (e === null) return;
    this.debug(`-- tagName="${e.target.tagName}" type="${e.target.type}" fsbGeneralOption? ${e.target.classList.contains("fsbGeneralOption")} id="${e.target.id}"`);

    this.#resetErrors();
    this.#resetMessages();

    var target = e.target;
    if ( ! target.classList.contains('fsbGeneralOption') ) {

      this.debug(`-- Event Target Element '${target.tagName}' classList does not contain class 'fsbGeneralOption'`);

    } else {

      if (target.tagName === "INPUT") {
        switch (target.type) {

          case 'radio':
            {
              const optionName  = target.id;
              const optionValue = target.checked;

              this.debug(`-- radio buttton selected ${optionName}=<${optionValue}> - group=${target.name}`);

              // first, set this option
              this.debug(`#optionChanged -- SAVING 'INPUT' type='radio' Option {[${optionName}]: ${optionValue}}`);
              await this.#fsbOptionsApi.saveOption(optionName, optionValue);

              // get all the elements with the same name, and if they're a radio, un-check them
              if (target.name) { /* && (optionValue === true || optionValue === 'true')) { Don't need this. Event fired *ONLY* when SELECTED, i.e. true */
                const radioGroupName = target.name;
                const radioGroup = document.querySelectorAll(`input[type="radio"][name="${radioGroupName}"]`);
                if (! radioGroup) {
                  this.debug('-- no radio group found');
                } else {
                  this.debug(`-- radio group members length=${radioGroup.length}`);
                  if (radioGroup.length < 2) {
                    this.debug('-- no radio group members to reset (length < 2)');
                  } else {
                    for (const radio of radioGroup) {
                      if (radio.id !== optionName) { // don't un-check the one that fired
                        this.debug(`-- resetting radio button {[${radio.id}]: false}`);
                        await this.#fsbOptionsApi.saveOption(radio.id, false);
                      }
                    }
                  }
                }
              }

              break;
            }

          case 'checkbox':
            {
              const optionName  = target.id;
              const optionValue = target.checked;

              this.debug(`-- SAVING 'INPUT' type='checkbox' Option {[${optionName}]: ${optionValue}}`);
              await this.#fsbOptionsApi.saveOption(optionName, optionValue);

              // special processing for these checkboxes
              if (target.classList.contains('open-close-check')) {
                if (this.#openCloseCheckboxChanged(target)) {
                  return; // <-----------------------------------------------------------------------------------<<<<<
                }
              }

              const forId = target.getAttribute('for');
              var   forDiv;
              if (forId) forDiv = document.querySelector(`div[id='${forId}']`);

              if (forId && forDiv) {
                this.#showHideDiv(forId, forDiv, optionValue);
              } else {
                // special processing for these checkboxes
                switch (optionName) {
                  case "fsbExtensionAccessControlEnabled":
                    this.#showHideExtensionAccessControls(optionValue);
                    break;
                  case "fsbShowLoggingOptions": // should be done by #openCloseCheckboxChanged now
                    this.#showHideLoggingOptions(optionValue);
                    break;
                  case "fsbShowOptionsHints": // should be done by #openCloseCheckboxChanged now
                    this.#showHideHints(optionValue);
                    break;
                  case "fsbShowOptionsActions":
                    this.#showHideActions(optionValue);
                    break;
                }
              }

              break;
            }

          case 'number': // VALIDATE THAT IT'S A NUMBER
          case 'email':  // VALIDATE THAT IT'S AN EMAIL ADDRESS
          case 'time':   // VALIDATE THAT IT'S A TIME
          case 'text':
            {
              const optionName  = target.id;
              const optionValue = target.value;
              this.debug(`-- SAVING 'INPUT' type='${tag.type}' Option {[${optionName}]: ${optionValue}}`);
              await this.#fsbOptionsApi.saveOption(optionName, optionValue);

              break;
            }

          default:
            this.debug(`-- Not configured to handle 'input' with type='${tag.type}' changed events`);

        } // END switch (target.type)

      } else if (target.tagName === 'SELECT') {

        const optionName  = target.id;
        var   optionValue = target.value;

        // too bad target.value returns a string
        switch (optionName) {
          case 'fsbAutoLogPurgeDays':
            {
              const numValue = Number(optionValue);
              if (! Number.isInteger(numValue)) {
                optionValue = 14; // 14 is the default
                // target.value = optionValue; ??? // MABXXX fix it???
              }
              break;
            }
          case 'fsbAutoRemoveUninstalledExtensionsDays':
            {
              const numValue = Number(optionValue);
              if (! Number.isInteger(numValue)) {
                optionValue = 2; // 2 is the default
                // target.value = optionValue; ??? // MABXXX fix it???
              }
              break;
            }
        }

        await this.#fsbOptionsApi.saveOption(optionName, optionValue);

      } else if (target.tagName === 'TEXTAREA') {

        this.debug("-- Not configured to handle 'textarea' changed events");

      } else {

        this.debug(`-- Not configured to handle '${target.tagName}' changed events`);

      }
    }
  }



  async #openCloseCheckboxChanged(checkbox) {
    this.debug(`-- CHECKBOX id="${checkbox.getAttribute('id')}" for="${checkbox.getAttribute('for')}" checked=${checkbox.checked}`);

    const openCloseElementId = checkbox.getAttribute('for');
    if (openCloseElementId) {
      const openCloseElement = document.getElementById(openCloseElementId);
      if (openCloseElement) {
        if (openCloseElement.tagName === "DIV") {
          openCloseElement.style.setProperty('display', checkbox.checked ? 'BLOCK' : 'NONE');
          return true;
        }
      }
    }

    return false;
  }



  async #openCloseWidgetSpanClicked(e, span) {
    this.debug(`-- SPAN id="${span.getAttribute('id')}" for="${span.getAttribute('for')}"`);
    const forId = span.getAttribute('for');

    if (! forId) {
      this.error("open-close-widget SPAN has no 'for' attribute:\n", span);
    } else {
      const selector          = `input[type='checkbox'][id='${forId}']`;
      const openCloseCheckbox = span.querySelector(selector);

      if (! openCloseCheckbox) {
        this.error(`FAILED TO FIND Checkbox for open-close-widget SPAN: selector="${selector}"`);
      } else {
        this.debug(`FOUND open-close-widget SPAN CheckBox: selector="${selector}" for=${openCloseCheckbox.getAttribute('for')}" old checked=${openCloseCheckbox.checked}`);
        openCloseCheckbox.click();
        return true;
      }
    }

    return false;
  }

  #showHideDiv(elementId, divElement, show) {
    if (show) divElement.style.display = 'BLOCK';
    else      divElement.style.display = 'NONE';
  }

  #showHideHints(show) {
    const hintsPanel = document.getElementById("fsbHintsPanel");
    if (hintsPanel) {
      if (show) {
        hintsPanel.style.setProperty('display', 'block');
      } else {
        hintsPanel.style.setProperty('display', 'none');
      }
    }
  }

  #showHideActions(show) {
    const optionActionTRs = document.querySelectorAll("tr.option-action");
    if (optionActionTRs) {
      for (const tr of optionActionTRs) {
        if (show) {
          tr.style.setProperty('display', 'table-row');
        } else {
          tr.style.setProperty('display', 'none');
        }
      }
    }
  }

  #showHideLoggingOptions(show) {
    const loggingOptionsPanel = document.getElementById("fsbLoggingOptions");
    if (loggingOptionsPanel) {
      if (show) {
        loggingOptionsPanel.style.setProperty('display', 'block');
      } else {
        loggingOptionsPanel.style.setProperty('display', 'none');
      }
    }
  }

  #showHideExtensionAccessControls(show) {
    const checkPanel          = document.getElementById("fsbShowGrantExtensionAccessDialogCheckPanel");
    const chooserOptionsPanel = document.getElementById("fsbExtensionChooserOptionsWrapper");
    if (show) {
      checkPanel.style.setProperty('display', 'block');
      chooserOptionsPanel.style.setProperty('display', 'block');
    } else {
      checkPanel.style.setProperty('display', 'none');
      chooserOptionsPanel.style.setProperty('display', 'none');
    }
  }



  // the user clicked an extension-head-button or extension-list-button or extension-edit-button: .edit-extension, .remove-extension, etc
  async #extensionControlButtonClicked(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    this.#resetErrors();
    this.#resetMessages();

    this.debug("-- begin");

    if (this.#DEBUG) this.debugAlways( "--", // don't build all this just to be denied by this.#DEBUG inside this.debug()
                                       `\n- tagName ........................ "${e.target.tagName}"`,
                                       `\n- id ............................. "${e.target.getAttribute('id')}"`,
                                       `\n- for ............................ "${e.target.getAttribute('for')}"`,
                                       `\n- extension-head-button? ......... ${e.target.classList.contains("extension-head-button")}`,
                                       `\n- extension-edit-button? ......... ${e.target.classList.contains("extension-edit-button")}`,
                                       `\n- extension-edit-error-button? ... ${e.target.classList.contains("extension-edit-error-button")}`,
                                       `\n- extension-list-button? ......... ${e.target.classList.contains("extension-list-button")}`,
                                       `\n- add-extension? ................. ${e.target.classList.contains("add-extension")}`,
                                       `\n- edit-extension? ................ ${e.target.classList.contains("edit-extension")}`,
                                       `\n- remove-extension? .............. ${e.target.classList.contains("remove-extension")}`,
                                       `\n- extensionId .................... "${e.target.getAttribute('extensionId')}"`,
                                     );

    var button;
    if (e.target.tagName === "BUTTON") {
      button = e.target;
    } else if (e.target.tagName === "LABEL" && e.target.parentElement && e.target.parentElement.tagName === "BUTTON") {
      button = e.target.parentElement;
    }

    if (button) {
      const buttonId = button.getAttribute("id");

      if (button.classList.contains("extension-edit-button")) {
        this.debug(`-- got edit button class "extension-edit-button", buttonId="${buttonId}"`);

        switch (buttonId) {
          case "extension_edit_cancel":
            await this.#extensionEditCancelButtonClicked(e);
            break;
          case "extension_edit_save":
            await this.#extensionEditSaveButtonClicked(e);
            break;
          default:
            this.debug(`-- UNKNOWN extension-edit-button BUTTON --  buttonId="${buttonId}"`);
        }

      } else if (button.classList.contains("extension-edit-error-button")) {
        this.debug(`-- got edit error button class "extension-edit-error-button", buttonId="${buttonId}"`);
        if (buttonId === "extension_edit_error_dismiss") {
            await this.#extensionEditErrorDismissButtonClicked(e);

        } else {
          this.debug(`-- UNKNOWN extension-edit-error-button BUTTON --  buttonId="${buttonId}"`);
        }

      } else if (button.classList.contains("extension-head-button")) {
        if (button.classList.contains("add-extension")) {
          await this.#addNewExtension(e);

        } else {
          this.debug(`-- UNKNOWN extension-head-button BUTTON --  buttonId="${buttonId}"`);
        }

      } else if (button.classList.contains("extension-list-button")) {
        if ( button.classList.contains("edit-extension")
             || button.classList.contains("remove-extension")
           )
        {
          if (! button.hasAttribute("extensionId")) {
            this.error("-- Cannot Edit or Remove Extension - Button has no \"extensionId\" Atttribute!!!");

          } else {
            const extensionId = button.getAttribute("extensionId");
            const selectorTR  = `tr.extension-list-item[extensionId='${extensionId}']`;
            const extensionTR = e.target.closest(selectorTR);

            if (extensionTR.classList.contains("extension-special"))  {
              // Should never happen - We should not have added an event listener to this TR
              this.error(`-- Cannot Edit or Remove - Extension is SPECIAL: extensionId="${extensionId}"`);

            } else if (extensionTR.classList.contains("extension-locked"))  {
              // Should never happen - We should not have added an event listener to this TR
              this.error(`-- Cannot Edit or Remove - Extension is LOCKED: extensionId="${extensionId}"`);

            } else {
              if (button.classList.contains("edit-extension")) {
                await this.#editExtension(e, extensionId);
              } else if (button.classList.contains("remove-extension")) {
                await this.#removeExtension(e, extensionId);
              }
            }
          }
        } else {
          this.debug("-- NOT OUR BUTTON -- got expected class \"extension-list-button\", but not expected button-specific class --");
        }
      } else {
        this.debug("-- NOT OUR BUTTON -- expected class \"extension-edit-button\" or \"extension-list-button\" not found --");
      }
    } else {
      this.debug("-- BUTTON NOT EXPECTED --");
    }

    this.debug("-- end");
  }



  async #extensionEditSaveButtonClicked(e) {
    e.preventDefault();

    this.debug( "--",
                `\n- this.#editorModeAdd         = ${this.#editorModeAdd}`,
                `\n- this.#editorModeEdit        = ${this.#editorModeEdit}`,
                `\n- this.#editorEditExtensionId = "${this.#editorEditExtensionId}"`
              );

    this.#resetErrors();
    this.#resetMessages();

    if (! this.#editorModeAdd && ! this.#editorModeEdit) {
      this.error("-- NEITHER editorModeAdd NOR editorModeEdit IS SET!!!");
      this.#setErrorFor("fsbExtensionOptionsTitle", "options_message_error_editorModeNotSet");

    } else {
      const editAllowAccessCheck  = document.getElementById("extension_edit_check_allow_access");
      const editExtensionIdText   = document.getElementById("extension_edit_text_id");
      const editExtensionNameText = document.getElementById("extension_edit_text_name");
      const editNoQuotaCheck      = document.getElementById("extension_edit_check_no_quota");
      const editLockCheck         = document.getElementById("extension_edit_check_lock");
      const editDirProtectCheck   = document.getElementById("extension_edit_check_dir_protect");
      const editReadOnlyCheck     = document.getElementById("extension_edit_check_read_only");

      const extensionEditErrorTR  = document.getElementById("extension_edit_error");
      const editNameErrorLabel    = document.getElementById("extension_edit_error_name");
      const editIdErrorLabel      = document.getElementById("extension_edit_error_id");

      const newExtensionId        =                   editExtensionIdText   ? editExtensionIdText.value    : "";
      const newExtensionName      =                   editExtensionNameText ? editExtensionNameText.value  : "";
      const newAllowAccess        =                   editAllowAccessCheck  ? editAllowAccessCheck.checked : false;
      const newNoQuota            =                   editNoQuotaCheck      ? editNoQuotaCheck.checked     : false;
      const newLock               =                   editLockCheck         ? editLockCheck.checked        : false;
      const newDirProtect         =                   editDirProtectCheck   ? editDirProtectCheck.checked  : false;
      const newReadOnly           = newAllowAccess && editReadOnlyCheck     ? editReadOnlyCheck.checked    : false;

      editNameErrorLabel.textContent = '';
      editIdErrorLabel.textContent   = '';

      var errors = 0;
      if (! newExtensionName) {
        this.debug("-- Empty Extension Name");
        editNameErrorLabel.textContent = this.#extensionListEditErrorExtensionNameEmpty;
        errors++;
      }

      if (! newExtensionId) {
        this.debug("-- Empty Extension ID");
        editIdErrorLabel.textContent = this.#extensionListEditErrorExtensionIdEmpty;
        errors++;
      } else if ( ! utils.isValidExtensionId(newExtensionId, true) ) { // allowUpperCase=true // && (newExtensionId !== this.#editorEditExtensionId) ???
        this.debug(`-- Invalid Extension ID: "${newExtensionId}"`);
        editIdErrorLabel.textContent = this.#extensionListEditErrorExtensionIdInvalid;
        errors++;
      }

      if (! errors) {
        if (this.#editorModeAdd) {
          // What if NEW Extension ID already exists???
          const props = await this.#fsbOptionsApi.getExtensionPropsById(newExtensionId);
          if (props) {
            this.debug(`-- editorModeAdd -- EXTENSION ID ALREADY EXISTS newExtensionId="${newExtensionId}"`);
            editIdErrorLabel.textContent = this.#extensionListEditErrorExtensionIdExists;
            errors++;

          } else {
            if (this.#DEBUG) this.debugAlways( "\n--- Adding Extension:",
                                               `\n- newExtensionId ..... "${newExtensionId}"`,
                                               `\n- newExtensionName ... "${newExtensionName}"`,
                                               `\n- newAllowAccess ..... ${newAllowAccess}`,
                                               `\n- newNoQuota ......... ${newNoQuota}`,
                                               `\n- newLock ............ ${newLock}`,
                                               `\n- newDirProtect ...... ${newDirProtect}`,
                                               `\n- newReadOnly ........ ${newReadOnly}`,
                                             );
            const newProps = await this.#fsbOptionsApi.addOrUpdateExtension( undefined,
                                                                             newExtensionId,
                                                                             newExtensionName,
                                                                             newAllowAccess,
                                                                             newLock,
                                                                             newDirProtect,
                                                                             newNoQuota,
                                                                             newReadOnly );

            if (! newProps) {
              this.error("-- editorModeAdd -- Options.addOrUpdateExtension FAILED TO RETURN NEW EXTENSION PROPERTIES");
              editNameErrorLabel.textContent = this.#extensionListEditErrorAddFailed;
//////////////editIdErrorLabel.textContent   = this.#extensionListEditErrorAddFailed;
              errors++;

            } else {
              // this will place the new one in the correct location in the sort order????
              await this.#insertExtensionsListItemUI(newExtensionId, newProps);
            }
          }

        } else if (this.#editorModeEdit) {

          // did they change the Extension ID???
          const extensionIdChanged = (newExtensionId !== this.#editorEditExtensionId);
          this.debugAlways(`\n\n---- extensionIdChange=${extensionIdChanged}: this.#editorEditExtensionId="${this.#editorEditExtensionId}" newExtensionId="${newExtensionId}"`);
          if (extensionIdChanged) {
            // What if NEW Extension ID already exists???
            const props = await this.#fsbOptionsApi.getExtensionPropsById(newExtensionId);
            if (props) {
              this.debug(`-- editorModeEdit -- EXTENSION ID ALREADY EXISTS: newExtensionId="${newExtensionId}"`);
              editIdErrorLabel.textContent = this.#extensionListEditErrorExtensionIdExists;
              errors++;
            }
          }

          if (! errors) {
            if (this.#DEBUG) this.debugAlways( "\n--- Updating Extension:",
                                               `\n- oldExtensionId ....... "${this.#editorEditExtensionId}"`,
                                               `\n- newExtensionId ....... "${newExtensionId}"`,
                                               `\n- extensionIdChanged ... ${extensionIdChanged}`,
                                               `\n- newExtensionName ..... "${newExtensionName}"`,
                                               `\n- newAllowAccess ....... ${newAllowAccess}`,
                                               `\n- newNoQuota ........... ${newNoQuota}`,
                                               `\n- newLock .............. ${newLock}`,
                                               `\n- newDirProtect ........ ${newDirProtect}`,
                                               `\n- newReadOnly .......... ${newReadOnly}`,
                                             );
            const newProps = await this.#fsbOptionsApi.addOrUpdateExtension( this.#editorEditExtensionId,
                                                                             newExtensionId,
                                                                             newExtensionName,
                                                                             newAllowAccess,
                                                                             newLock,
                                                                             newDirProtect,
                                                                             newNoQuota,
                                                                             newReadOnly,
                                                                           );

            if (! newProps) {
              this.error("-- editorModeEdit -- Options.addOrUpdateExtension FAILED TO RETURN NEW EXTENSION PROPERTIES");
              editNameErrorLabel.textContent = this.#extensionListEditErrorUpdateFailed;
//////////////editIdErrorLabel.textContent   = this.#extensionListEditErrorUpdateFailed;
              errors++;

            } else {
              // this will delete the old one if the extension ID changed
              // and place the new one in the correct location in the sort order???
              const updateErrors = await this.#updateExtensionsListItemUI(this.#editorEditExtensionId, newExtensionId, newProps);
              if (updateErrors) {
                editNameErrorLabel.textContent = this.#extensionListEditErrorUIUpdateFailed;
                errors += updateErrors;
              }
            }
          }
        }
      }

      if (errors) {
        extensionEditErrorTR.classList.remove('display-none');

      } else {
        await this.#exitEditMode();
      }
    }
  }

  async #extensionEditCancelButtonClicked(e) {
    e.preventDefault();

    this.#resetErrors();
    this.#resetMessages();

    await this.#exitEditMode();
  }

  async #extensionEditErrorDismissButtonClicked(e) {
    e.preventDefault();

    const extensionEditErrorTR     = document.getElementById("extension_edit_error");
    const editNameErrorLabel       = document.getElementById("extension_edit_error_name");
    const editIdErrorLabel         = document.getElementById("extension_edit_error_id");

    extensionEditErrorTR.classList.add('display-none'); // HIDE the Editor Fields Error Row - turn ON display: none
    editNameErrorLabel.textContent = '';
    editIdErrorLabel.textContent   = '';
  }



  async #exitEditMode() {
    this.debug("-- begin");

    const extensionListTable      = document.getElementById("fsbExtensionList");
    const extensionEditTitleTR    = document.getElementById("extension_edit_title");
    const extensionEditTitleLabel = document.getElementById("extension_edit_title_text");
    const extensionEditTR         = document.getElementById("extension_edit");

    const editAllowAccessCheck    = document.getElementById("extension_edit_check_allow_access");
    const editExtensionIdText     = document.getElementById("extension_edit_text_id");
    const editExtensionNameText   = document.getElementById("extension_edit_text_name");
    const editNoQuotaCheck        = document.getElementById("extension_edit_check_no_quota");
    const editLockCheck           = document.getElementById("extension_edit_check_lock");
    const editDirProtectCheck     = document.getElementById("extension_edit_check_dir_protect");
    const editReadOnlyCheck       = document.getElementById("extension_edit_check_read_only");

    const extensionEditErrorTR    = document.getElementById("extension_edit_error");
    const editNameErrorLabel      = document.getElementById("extension_edit_error_name");
    const editIdErrorLabel        = document.getElementById("extension_edit_error_id");



    extensionListTable.classList.remove("edit-mode");



    // Reset & HIDE the Editor Title Row - turn ON display: none
    extensionEditTitleTR.classList.add('display-none');
    extensionEditTitleLabel.textContent = '';



    // Reset Inputs & Hide the Editor Fields Row - turn ON display: none
    extensionEditTR.classList.add('display-none');
    editAllowAccessCheck.checked  = false;
    editExtensionIdText.value     = '';
    editExtensionNameText.value   = '';
    editNoQuotaCheck.checked      = false;
    editLockCheck.checked         = false;
    editDirProtectCheck.checked   = false;
    editReadOnlyCheck.checked     = false;



    // Reset & HIDE the Editor Fields Error Row - turn ON display: none
    extensionEditErrorTR.classList.add('display-none');
    editNameErrorLabel.textContent = '';
    editIdErrorLabel.textContent   = '';



    // RE-ENABLE EVERYTHING IN THE EXTENSION ACCESS CONTROLS UI

    var selector;
    var checkbox;
    var checkLabel;
    var button;

    selector = "button.add-extension"; // extension-head-item > extension-head-controls-right > extension-edit-controls > add-extension
    button   = extensionListTable.querySelector(selector);
    if (! button) {
      this.error(`-- Failed to select ADD Extension Button, selector="${selector}"`);
    } else {
      button.disabled = false;
    }

    // RE-ENABLE ALL THE BUTTONS & CHECKBOXES FOR ALL EXTENSIONS, Taking heed of Extensions that are SPECIAL or LOCKED, etc
    const domExtensionTRs = document.querySelectorAll("tr.extension-list-item");
    this.debug(`-- domExtensionTRs.length=${domExtensionTRs.length}`);
    for (const domExtensionTR of domExtensionTRs) {

      const extensionId      =                       domExtensionTR.getAttribute("extensionId");
      const special          =                       domExtensionTR.classList.contains("extension-special");      // MABXXX Get this from ExtensionProps instead?
      const accessDisallowed = ! special          && domExtensionTR.classList.contains("access-disallowed");      // MABXXX Get this from ExtensionProps instead?
      const noQuota          = special            || domExtensionTR.classList.contains("extension-no-quota");     // MABXXX Get this from ExtensionProps instead?
      const locked           = special            || domExtensionTR.classList.contains("extension-locked");       // MABXXX Get this from ExtensionProps instead?
      const dirProtect       = special            || domExtensionTR.classList.contains("extension-dir-protect");  // MABXXX Get this from ExtensionProps instead?
      const readOnly         = ! accessDisallowed && domExtensionTR.classList.contains("extension-read-only");    // MABXXX Get this from ExtensionProps instead?

      if (special) {
        this.debug(`-- Extension is SPECIAL: extensionId="${extensionId}"`);
      }
      if (accessDisallowed) {
        this.debug(`-- Extension is ACCESS-DISALLOWED: extensionId="${extensionId}"`);
      }
      if (locked) {
        this.debug(`-- Extension is LOCKED: extensionId="${extensionId}"`);
      }
      if (dirProtect) {
        this.debug(`-- Extension is DIR_PROTECTED: extensionId="${extensionId}"`);
      }
      if (readOnly) {
        this.debug(`-- Extension is READ-ONLY: extensionId="${extensionId}"`);
      }

      this.debug(`-- Adjusting Enabled State of controls for Extension: extensionId="${extensionId}"`);

      selector = `input[type='checkbox'].allow-access-check[extensionId='${extensionId}']`;
      checkbox = domExtensionTR.querySelector(selector);

      if (! checkbox) {
        this.error(`-- Failed to select ALLOW_ACCESS Checkbox for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else if (special || locked) {
////////checkLabel = checkbox.nextElementSibling;
        checkbox.disabled = true;
        if (special) {
          checkbox.setAttribute(   'title', this.#tooltip_checkbox_allowAccess_disabled_special );
//////////checkLabel.setAttribute( 'title', this.#tooltip_checkbox_allowAccess_disabled_special );
        } else {
          checkbox.setAttribute(   'title', this.#tooltip_checkbox_allowAccess_disabled_locked );
//////////checkLabel.setAttribute( 'title', this.#tooltip_checkbox_allowAccess_disabled_locked );
        }
      } else {
        checkbox.disabled = false;
        if (accessDisallowed) {
          checkbox.setAttribute(   'title', this.#tooltip_checkbox_allowAccess_enabled_unchecked );
//////////checkLabel.setAttribute( 'title', this.#tooltip_checkbox_allowAccess_enabled_unchecked );
        } else {
          checkbox.setAttribute(   'title', this.#tooltip_checkbox_allowAccess_enabled_checked );
//////////checkLabel.setAttribute( 'title', this.#tooltip_checkbox_allowAccess_enabled_checked );
        }
      }

      selector = `button.edit-extension[extensionId='${extensionId}']`;
      button   = domExtensionTR.querySelector(selector);
      if (! button) {
        this.error(`-- Failed to select EDIT Button for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        if (special || locked) {
          button.disabled = true;
          if (special) {
            button.setAttribute('title', this.#tooltip_button_edit_disabled_special);
          } else {
            button.setAttribute('title', this.#tooltip_button_edit_disabled_locked);
          }
        } else {
          button.disabled = false;
          button.setAttribute('title', this.#tooltip_button_edit_enabled);
        }
      }

      selector = `input[type='checkbox'].no-quota-check[extensionId='${extensionId}']`;
      checkbox = domExtensionTR.querySelector(selector);

      if (! checkbox) {
        this.error(`-- Failed to select NO_QUOTA Checkbox for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        checkLabel = checkbox.nextElementSibling;
        if (special || locked) {
          checkbox.disabled = true;
          if (special) {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_noQuota_disabled_special );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_noQuota_disabled_special );
          } else {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_noQuota_disabled_locked );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_noQuota_disabled_locked );
          }
        } else {
          checkbox.disabled = false;
          if (noQuota) {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_noQuota_enabled_checked );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_noQuota_enabled_checked );
          } else {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_noQuota_enabled_unchecked );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_noQuota_enabled_unchecked );
          }
        }
      }

      selector = `input[type='checkbox'].lock-check[extensionId='${extensionId}']`;
      checkbox = domExtensionTR.querySelector(selector);

      if (! checkbox) {
        this.error(`-- Failed to select LOCK Checkbox for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        checkLabel = checkbox.nextElementSibling;
        if (special) {
          checkbox.disabled = true;
          checkbox.setAttribute(   'title', this.#tooltip_checkbox_lock_disabled_special );
          checkLabel.setAttribute( 'title', this.#tooltip_checkbox_lock_disabled_special );
        } else {
          checkbox.disabled = false;
          if (locked) {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_lock_enabled_checked );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_lock_enabled_checked );
          } else {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_lock_enabled_unchecked );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_lock_enabled_unchecked );
          }
        }
      }

      selector = `input[type='checkbox'].dir-protect-check[extensionId='${extensionId}']`;
      checkbox = domExtensionTR.querySelector(selector);

      if (! checkbox) {
        this.error(`-- Failed to select DIR-PROTECT Checkbox for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        checkLabel = checkbox.nextElementSibling;
        if (special || locked) {
          checkbox.disabled = true;
          if (special) {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_dirProtect_disabled_special );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_dirProtect_disabled_special );
          } else {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_dirProtect_disabled_locked );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_dirProtect_disabled_locked );
          }
        } else {
          checkbox.disabled = false;
          if (dirProtect) {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_dirProtect_enabled_checked );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_dirProtect_enabled_checked );
          } else {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_dirProtect_enabled_unchecked);
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_dirProtect_enabled_unchecked);
          }
        }
      }

      selector = `input[type='checkbox'].read-only-check[extensionId='${extensionId}']`;
      checkbox = domExtensionTR.querySelector(selector);

      if (! checkbox) {
        this.error(`-- Failed to select READ-ONLY Checkbox for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        checkLabel = checkbox.nextElementSibling;
        if (special || locked || accessDisallowed) {
          checkbox.disabled = true;
          if (special || accessDisallowed) { // extensions that are not allowed access at all cannot then have read-only access
            checkbox.checked  = false; // <--------------------------------------------------------------------------<<<<<
          }
          if (special) {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_readOnly_disabled_special );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_readOnly_disabled_special );
          } else if (accessDisallowed) {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_readOnly_disabled_accessDisallowed );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_readOnly_disabled_accessDisallowed );
          } else {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_readOnly_disabled_locked );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_readOnly_disabled_locked );
          }
        } else {
          checkbox.disabled = false;
          if (readOnly) {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_readOnly_enabled_checked );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_readOnly_enabled_checked );
          } else {
            checkbox.setAttribute(   'title', this.#tooltip_checkbox_readOnly_enabled_unchecked );
            checkLabel.setAttribute( 'title', this.#tooltip_checkbox_readOnly_enabled_unchecked );
          }
        }
      }

      selector = `button.remove-extension[extensionId='${extensionId}']`;
      button   = domExtensionTR.querySelector(selector);
      if (! button) {
        this.error(`-- Failed to select DELETE Button for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        if (special || locked) {
          button.disabled = true;
          if (special) {
            button.setAttribute('title', this.#tooltip_button_remove_disabled_special);
          } else {
            button.setAttribute('title', this.#tooltip_button_remove_disabled_locked);
          }
        } else {
          button.disabled = false;
          button.setAttribute('title', this.#tooltip_button_remove_enabled);
        }
      }
    }



    await this.#enableExtensionAccessControls(true);

    this.#editorModeAdd         = false;
    this.#editorModeEdit        = false;
    this.#editorEditExtensionId = undefined;

    this.debug("-- end");
  }



  // the user clicked a allowAccess/noQuota/lock/dirProtect/readOnly/etc checkbox for an Extension, etc
  async #extensionOptionCheckChanged(e) {
    if (e === null) return;

    this.#resetErrors();
    this.#resetMessages();

    this.debug("-- begin");
    if (this.#DEBUG) this.debugAlways( "--", // don't build all this just to be denied by this.#DEBUG in this.debug()
                                       `\n- tagName ................. "${e.target.tagName}"`,
                                       `\n- type .................... "${e.target.type}"`,
                                       `\n- id ...................... "${e.target.getAttribute('id')}"`,
                                       `\n- for ..................... "${e.target.getAttribute('for')}"`,
                                       `\n- extension-edit-check? ... ${e.target.classList.contains('extension-edit-check')}`,
                                       `\n- extension-check? ........ ${e.target.classList.contains('extension-check')}`,
                                       `\n- allow-access-check? ..... ${e.target.classList.contains('allow-access-check')}`,
                                       `\n- read-only-check? ........ ${e.target.classList.contains('read-only-check')}`,
                                       `\n- no-quota-check? ......... ${e.target.classList.contains('no-quota-check')}`,
                                       `\n- lock-check? ............. ${e.target.classList.contains('lock-check')}`,
                                       `\n- dir-protect-check? ...... ${e.target.classList.contains('dir-protect-check')}`,
                                       `\n- extensionId ............. "${e.target.getAttribute('extensionId')}"`,
                                       `\n- checked? ................ ${e.target.checked}`,
                                     );

    // MABXXX I thought the browser was supposed to take care of this <label> with a "for" attribute stuff...
    var target = e.target;
    if (e.target.tagName === 'LABEL') {
      const forID = e.target.getAttribute("for");
      this.debug(`-- LABEL CLICKED -- id="${e.target.getAttribute('id')}" forId="${forId}" `);

      if (forId) {
        const forElement = document.getElementById(forId);
        if (forElement) {
          target = forElement;
          this.debug(`-- LABEL CLICKED, "FOR" ELEMENT FOUND -- id="${target.getAttribute('id')}"`);
        }
      }
    }

    // notice that this code handles ONLY <input type="checkbox"> with class "extension-edit-check" or with class "extension-check" (and then only certain other classes)
    if ( target
         && target.tagName === 'INPUT'
         && target.type === 'checkbox'
         && ( target.classList.contains("extension-edit-check")
              || ( target.classList.contains("extension-check")
                   && ( target.classList.contains("allow-access-check")
                        || target.classList.contains("no-quota-check")
                        || target.classList.contains("lock-check")
                        || target.classList.contains("dir-protect-check")
                        || target.classList.contains("read-only-check")
                      )
                 )
            )
       )
    {
//////e.stopPropagation();
      e.stopImmediatePropagation();

      if (target.classList.contains("extension-edit-check")) {
        const checked    = e.target.checked;
        const checkboxId = e.target.getAttribute("id");
        switch (checkboxId) {
          case "extension_edit_check_allow_access":
            await this.#extensionEditAllowAccessCheckboxChanged(e, checked);
            break;
          case "extension_edit_check_read_only":
            await this.#extensionEditReadOnlyCheckboxChanged(e, checked);
            break;
          case "extension_edit_check_no_quota":
            await this.#extensionEditNoQuotaCheckboxChanged(e, checked);
            break;
          case "extension_edit_check_lock":
            await this.#extensionEditLockCheckboxChanged(e, checked);
            break;
          case "extension_edit_check_dir_protect":
            await this.#extensionEditDirProtectCheckboxChanged(e, checked);
            break;
          default:
            this.debug(`EDITOR CHECKBOX WITH UNKNOWN ID CLICKED id="${checkboxId}" checked=${checked}`);
        }

      } else if (target.classList.contains("extension-check")) {
        if (! target.hasAttribute("extensionId")) { // if it doesn't have an extensionId then we can't deal with it
          this.error("\n\n----- NO \"extensionId\" - CANNOT PROCEED!!!\n- target:", e.target, "\n\n");

        } else {
          const checked     = e.target.checked;
          const extensionId = e.target.getAttribute("extensionId");
          const extProps    = await this.#fsbOptionsApi.getExtensionPropsById(extensionId);

          if (! extProps) {
            this.debug(`-- EXTENSION PROPS NOT FOUND -- extensionId="${extensionId}"`);

          } else {
            // is it an allowAccess checkbox?
            if (e.target.classList.contains("allow-access-check")) { // extension-list-item > extension-list-controls-right > allow-access-check
              await this.#extAllowAccessCheckboxClicked(e, extensionId, extProps, checked);

            } else if (e.target.classList.contains("no-quota-check")) { // extension-list-item > extension-list-controls-right > edit-controls > no-quota-check
              await this.#extNoQuotaCheckboxClicked(e, extensionId, extProps, checked);

            } else if (e.target.classList.contains("lock-check")) { // extension-list-item > extension-list-controls-right > edit-controls > lock-check
              await this.#extLockCheckboxClicked(e, extensionId, extProps, checked);

            } else if (e.target.classList.contains("dir-protect-check")) { // extension-list-item > extension-list-controls-right > edit-controls > dir-protect-check
              await this.#extDirProtectCheckboxClicked(e, extensionId, extProps, checked);

            } else if (e.target.classList.contains("read-only-check")) { // extension-list-item > extension-list-controls-right > read-only-check
              await this.#extReadOnlyCheckboxClicked(e, extensionId, extProps, checked);

            } else {
              // We don't know exactly which checkbox it is!!!  The outer "if" test should have prevented this
              this.debug("-- NOT OUR CHECKBOX --");
            }
          }
        }
      }
    } else {
      this.debug("-- NOT OUR CHECKBOX --");
    }

    this.debug("-- end");
  }



  async #extensionEditAllowAccessCheckboxChanged(e, checked) {
    this.debug(`EDITOR ALLOW ACCESS CHECKBOX CLICKED: checked=${checked}`);

    const allowAccessCheck      = e.target;
////const allowAccessCheckLabel = allowAccessCheck.nextElementSibling;
    const readOnlyCheck         = document.getElementById("extension_edit_check_read_only");
    const readOnlyCheckLabel    = readOnlyCheck.nextElementSibling;

    if (checked) {
      readOnlyCheck.disabled = false;

      allowAccessCheck.setAttribute(      "title", this.#tooltip_checkbox_allowAccess_enabled_checked );
//////allowAccessCheckLabel.setAttribute( "title", this.#tooltip_checkbox_allowAccess_enabled_checked );

      readOnlyCheck.setAttribute(         "title", this.#tooltip_checkbox_readOnly_enabled_unchecked  );
      readOnlyCheckLabel.setAttribute(    "title", this.#tooltip_checkbox_readOnly_enabled_unchecked  );

    } else {
      readOnlyCheck.checked  = false;
      readOnlyCheck.disabled = true;

      allowAccessCheck.setAttribute(      "title", this.#tooltip_checkbox_allowAccess_enabled_unchecked      );
//////allowAccessCheckLabel.setAttribute( "title", this.#tooltip_checkbox_allowAccess_enabled_unchecked      );

      readOnlyCheck.setAttribute(         "title", this.#tooltip_checkbox_readOnly_disabled_accessDisallowed );
      readOnlyCheckLabel.setAttribute(    "title", this.#tooltip_checkbox_readOnly_disabled_accessDisallowed );
    }
  }

  async #extensionEditReadOnlyCheckboxChanged(e, checked) {
    this.debug(`EDITOR READ ONLY CHECKBOX CLICKED: checked=${checked}`);

    const readOnlyCheck      = e.target;
    const readOnlyCheckLabel = readOnlyCheck.nextElementSibling;

    if (checked) {
      readOnlyCheck.setAttribute(      "title", this.#tooltip_checkbox_readOnly_enabled_checked );
      readOnlyCheckLabel.setAttribute( "title", this.#tooltip_checkbox_readOnly_enabled_checked );
    } else {
      readOnlyCheck.setAttribute(      "title", this.#tooltip_checkbox_readOnly_enabled_unchecked );
      readOnlyCheckLabel.setAttribute( "title", this.#tooltip_checkbox_readOnly_enabled_unchecked );
    }
  }

  async #extensionEditNoQuotaCheckboxChanged(e, checked) {
    this.debug(`EDITOR NO QUOTA CHECKBOX CLICKED: checked=${checked}`);

    const noQuotaCheck      = e.target;
    const noQuotaCheckLabel = noQuotaCheck.nextElementSibling;

    if (checked) {
      noQuotaCheck.setAttribute(      "title", this.#tooltip_checkbox_noQuota_enabled_checked );
      noQuotaCheckLabel.setAttribute( "title", this.#tooltip_checkbox_noQuota_enabled_checked );
    } else {
      noQuotaCheck.setAttribute(      "title", this.#tooltip_checkbox_noQuota_enabled_unchecked );
      noQuotaCheckLabel.setAttribute( "title", this.#tooltip_checkbox_noQuota_enabled_unchecked );
    }
  }

  async #extensionEditLockCheckboxChanged(e, checked) {
    this.debug(`EDITOR LOCK CHECKBOX CLICKED: checked=${checked}`);

    const lockCheck      = e.target;
    const lockCheckLabel = lockCheck.nextElementSibling;

    if (checked) {
      lockCheck.setAttribute(      "title", this.#tooltip_checkbox_lock_enabled_checked );
      lockCheckLabel.setAttribute( "title", this.#tooltip_checkbox_lock_enabled_checked );
    } else {
      lockCheck.setAttribute(      "title", this.#tooltip_checkbox_lock_enabled_unchecked );
      lockCheckLabel.setAttribute( "title", this.#tooltip_checkbox_lock_enabled_unchecked );
    }
  }

  async #extensionEditDirProtectCheckboxChanged(e, checked) {
    this.debug(`EDITOR DIR PROTECT CHECKBOX CLICKED: checked=${checked}`);

    const dirProtectCheck      = e.target;
    const dirProtectCheckLabel = dirProtectCheck.nextElementSibling;

    if (checked) {
      dirProtectCheck.setAttribute(      "title", this.#tooltip_checkbox_dirProtect_enabled_checked );
      dirProtectCheckLabel.setAttribute( "title", this.#tooltip_checkbox_dirProtect_enabled_checked );
    } else {
      dirProtectCheck.setAttribute(      "title", this.#tooltip_checkbox_dirProtect_enabled_unchecked );
      dirProtectCheckLabel.setAttribute( "title", this.#tooltip_checkbox_dirProtect_enabled_unchecked );
    }
  }






  async #extAllowAccessCheckboxClicked(e, extensionId, extProps, allowAccess) {
    this.debug(`-- OLD PROPS: extProps.id="${extProps.id}" extProps.name="${extProps.name}" allowAccess=${extProps.allowAccess}`);
    this.debug(`-- NEW allowAccess=${allowAccess}`);

    this.#resetErrors();
    this.#resetMessages();

    // find the TR.extension-list-item and set the classes and/or attributes
    const allowAccessCheck      = e.target;
////const allowAccessCheckLabel = allowAccessCheck.nextElementSibling;
    //
    const extensionSelector     = `tr.extension-list-item[extensionId='${extensionId}']`
    const domSelectedExtension  = document.querySelector(extensionSelector);
    if (! domSelectedExtension) {
      this.error(`(allowAccess) -- DID NOT FIND OUR extension-list-item: "${extensionSelector}"`);

    } else if (domSelectedExtension.classList.contains("extension-special")) { // MABXXX verify with extProps
      this.error(`-- Cannot change allowAccess State - extension is SPECIAL`);

    } else if (domSelectedExtension.classList.contains("extension-locked")) { // MABXXX verify with extProps
      this.error(`-- Cannot change allowAccess State - extension is LOCKED`);

    } else {
      const readOnlyCheckSelector      = `input[type='checkbox'][extensionId='${extensionId}'].read-only-check`
      const readOnlyCheckLabelSelector = `label[extensionId='${extensionId}'].read-only-check`

      const readOnlyCheck              = domSelectedExtension.querySelector( readOnlyCheckSelector         );
      const readOnlyCheckLabel         = domSelectedExtension.querySelector( readOnlyCheckLabelSelector    );

      this.debug(`(allowAccess) -- Found our extension-list-item: "${extensionSelector}"`);

      extProps['allowAccess'] = allowAccess;
      this.debug("-- new allowAccess checkbox status: ", extProps);

      await this.#fsbOptionsApi.storeExtensionPropsById(extensionId, extProps);

      if (allowAccess) {
        this.debug("(allowAccess) -- removing class \"access-disallowed\"");
        domSelectedExtension.classList.remove("access-disallowed");
        readOnlyCheck.disabled = false;
        allowAccessCheck.setAttribute(      "title", this.#tooltip_checkbox_allowAccess_enabled_checked );
////////allowAccessCheckLabel.setAttribute( "title", this.#tooltip_checkbox_allowAccess_enabled_checked );
        readOnlyCheck.setAttribute(         "title", this.#tooltip_checkbox_readOnly_enabled_unchecked  );
        readOnlyCheckLabel.setAttribute(    "title", this.#tooltip_checkbox_readOnly_enabled_unchecked  );
      } else {
        this.debug("(allowAccess) -- adding class \"access-disallowed\"");
        domSelectedExtension.classList.add("access-disallowed");
        this.debug("(allowAccess) -- removing class \"extension-read-only\"");
        domSelectedExtension.classList.remove("extension-read-only");
        readOnlyCheck.disabled = true;
        readOnlyCheck.checked  = false;
        allowAccessCheck.setAttribute(      "title", this.#tooltip_checkbox_allowAccess_enabled_unchecked      );
////////allowAccessCheckLabel.setAttribute( "title", this.#tooltip_checkbox_allowAccess_enabled_unchecked      );
        readOnlyCheck.setAttribute(         "title", this.#tooltip_checkbox_readOnly_disabled_accessDisallowed );
        readOnlyCheckLabel.setAttribute(    "title", this.#tooltip_checkbox_readOnly_disabled_accessDisallowed );
      }
    }

    this.debug("-- end");
  }



  async #extReadOnlyCheckboxClicked(e, extensionId, extProps, readOnly) {
    this.debug(`-- OLD PROPS: extProps.id="${extProps.id}" extProps.name="${extProps.name}" readOnly=${extProps.readOnly}`);
    this.debug(`-- NEW readOnly=${readOnly}`);

    this.#resetErrors();
    this.#resetMessages();

    // find the TR.extension-list-item and set the classes and/or attributes
    const readOnlyCheckbox      = e.target;
    const readOnlyCheckboxLabel = readOnlyCheckbox.nextElementSibling;

    const extensionSelector     = `tr.extension-list-item[extensionId='${extensionId}']`
    const domSelectedExtension  = document.querySelector(extensionSelector);

    if (! domSelectedExtension) {
      this.error(`(readOnly) -- DID NOT FIND OUR extension-list-item: "${extensionSelector}"`);

    } else if (domSelectedExtension.classList.contains("extension-special")) { // MABXXX verify with extProps
      this.error(`-- Cannot change readOnly State - extension is SPECIAL`);

    } else if (domSelectedExtension.classList.contains("extension-locked")) { // MABXXX verify with extProps
      this.error(`-- Cannot change readOnly State - extension is LOCKED`);

    } else if (domSelectedExtension.classList.contains("access-disallowed")) { // MABXXX verify with extProps
      this.error(`-- Cannot change readOnly State - extension is NOT ALLOW-ACCESS`);

    } else {
      this.debug(`(readOnly) -- Found our extension-list-item: "${extensionSelector}"`);

      extProps['readOnly'] = readOnly;

      await this.#fsbOptionsApi.storeExtensionPropsById(extensionId, extProps);

      if (readOnly) {
        this.debug("(readOnly) -- adding class \"extension-read-only\"");
        domSelectedExtension.classList.add("extension-read-only");
        readOnlyCheckbox.setAttribute(      'title', this.#tooltip_checkbox_readOnly_enabled_checked );
        readOnlyCheckboxLabel.setAttribute( 'title', this.#tooltip_checkbox_readOnly_enabled_checked );
      } else {
        this.debug("(readOnly) -- removing class \"extension-read-only\"");
        domSelectedExtension.classList.remove("extension-read-only");
        readOnlyCheckbox.setAttribute(      'title', this.#tooltip_checkbox_readOnly_enabled_unchecked );
        readOnlyCheckboxLabel.setAttribute( 'title', this.#tooltip_checkbox_readOnly_enabled_unchecked );
      }
    }

    this.debug("-- end");
  }



  async #extNoQuotaCheckboxClicked(e, extensionId, extProps, noQuota) {
    this.debug(`-- OLD PROPS: extProps.id="${extProps.id}" extProps.name="${extProps.name}" noQuota=${extProps.noQuota}`);
    this.debug(`-- NEW noQuota=${noQuota}`);

    this.#resetErrors();
    this.#resetMessages();

    // this is the only Marker that is ALWAYS present and needs to change its Icon and Tooltip
    const markerSelector = `tr.extension-list-item[extensionId='${extensionId}'].marker-no-quota`;
    const noQuotaMarker  = document.querySelector(markerSelector);
    if (! noQuotaMarker) {
      this.error(`FAILED TO GET noQuotaMarker - selector="${markerSelector}"`);
    }

    // find the TR.extension-list-item and set the classes and/or attributes
    const noQuotaCheckbox       = e.target;
    const noQuotaCheckboxLabel  = noQuotaCheckbox.nextElementSibling;

    const extensionSelector     = `tr.extension-list-item[extensionId='${extensionId}']`
    const domSelectedExtension  = document.querySelector(extensionSelector);

    if (! domSelectedExtension) {
      this.error(`(noQuota) -- DID NOT FIND OUR extension-list-item: "${extensionSelector}"`);

    } else if (domSelectedExtension.classList.contains("extension-special")) { // MABXXX verify with extProps
      this.error(`-- Cannot change noQuota State - extension is SPECIAL`);

    } else if (domSelectedExtension.classList.contains("extension-locked")) { // MABXXX verify with extProps
      this.error(`-- Cannot change noQuota State - extension is LOCKED`);

    } else {
      this.debug(`(noQuotaAlways) -- Found our extension-list-item: "${extensionSelector}"`);

      extProps['noQuota'] = noQuota;
      this.debug("-- new noQuota checkbox status: ", extProps);

      await this.#fsbOptionsApi.storeExtensionPropsById(extensionId, extProps);

      if (noQuota) {
        this.debug("(noQuota) -- adding class \"extension-no-quota\"");
        domSelectedExtension.classList.add("extension-no-quota");
        noQuotaCheckbox.setAttribute(      'title', this.#tooltip_checkbox_noQuota_enabled_unchecked );
        noQuotaCheckboxLabel.setAttribute( 'title', this.#tooltip_checkbox_noQuota_enabled_unchecked );
        if (noQuotaMarker) noQuotaMarker.setAttribute("title", this.#extensionList_marker_tooltip_quotasDisabled);
      } else {
        this.debug("(noQuota) -- removing class \"extension-no-quota\"");
        domSelectedExtension.classList.remove("extension-no-quota");
        noQuotaCheckbox.setAttribute(      'title', this.#tooltip_checkbox_noQuota_enabled_checked );
        noQuotaCheckboxLabel.setAttribute( 'title', this.#tooltip_checkbox_noQuota_enabled_checked );
        if (noQuotaMarker) noQuotaMarker.setAttribute("title", this.#extensionList_marker_tooltip_quotasEnabled);
      }
    }

    this.debug("-- end");
  }



  async #extLockCheckboxClicked(e, extensionId, extProps, locked) {
    this.debug(`-- OLD PROPS: extProps.id="${extProps.id}" extProps.name="${extProps.name}" locked=${extProps.locked}`);
    this.debug(`-- NEW locked=${locked}`);

    this.#resetErrors();
    this.#resetMessages();

    const lockCheck             = e.target;
    const lockCheckLabel        = lockCheck.nextElementSibling;

    // find the TR.extension-list-item and set the classes and/or attributes
    const extensionSelector     = `tr.extension-list-item[extensionId='${extensionId}']`
    const domSelectedExtension  = document.querySelector(extensionSelector);
    if (! domSelectedExtension) {
      this.error(`(lock) -- DID NOT FIND OUR extension-list-item: "${extensionSelector}"`);

    } else if (domSelectedExtension.classList.contains("extension-special")) { // MABXXX verify with extProps
      this.error(`-- Cannot change Lock State - extension is SPECIAL`);

    } else {
      this.debug(`(lock) -- Found our extension-list-item: "${extensionSelector}"`);

      extProps['locked'] = locked;
      this.debug("-- new locked checkbox status: ", extProps);

      await this.#fsbOptionsApi.storeExtensionPropsById(extensionId, extProps);

      const allowAccessCheckSelector      = `input[type='checkbox'][extensionId='${extensionId}'].allow-access-check`
      const allowAccessCheckLabelSelector = `label[extensionId='${extensionId}'].allow-access-check` // MABXXX JUST A REGULAR CHECKBOX FOR NOW
      const editButtonSelector            = `button[extensionId='${extensionId}'].edit-extension`
      const noQuotaCheckSelector          = `input[type='checkbox'][extensionId='${extensionId}'].no-quota-check`
      const noQuotaCheckLabelSelector     = `label[extensionId='${extensionId}'].no-quota-check`
//////const lockCheckSelector             = `input[type='checkbox'][extensionId='${extensionId}'].lock-check`
//////const lockCheckLabelSelector        = `label[extensionId='${extensionId}'].lock-check`
      const dirProtectCheckSelector       = `input[type='checkbox'][extensionId='${extensionId}'].dir-protect-check`
      const dirProtectCheckLabelSelector  = `label[extensionId='${extensionId}'].dir-protect-check`
      const readOnlyCheckSelector         = `input[type='checkbox'][extensionId='${extensionId}'].read-only-check`
      const readOnlyCheckLabelSelector    = `label[extensionId='${extensionId}'].read-only-check`
      const removeButtonSelector          = `button[extensionId='${extensionId}'].remove-extension`

      const allowAccessCheck      = domSelectedExtension.querySelector( allowAccessCheckSelector      );
//////const allowAccessCheckLabel = domSelectedExtension.querySelector( allowAccessCheckLabelSelector ); // use nextElementSibling // MABXXX JUST A REGULAR CHECKBOX FOR NOW
      const editButton            = domSelectedExtension.querySelector( editButtonSelector            );
      const noQuotaCheck          = domSelectedExtension.querySelector( noQuotaCheckSelector          );
      const noQuotaCheckLabel     = domSelectedExtension.querySelector( noQuotaCheckLabelSelector     ); // use nextElementSibling
//////const lockCheck             = domSelectedExtension.querySelector( lockCheckSelector             );
//////const lockCheckLabel        = domSelectedExtension.querySelector( lockCheckLabelSelector        ); // use nextElementSibling
      const dirProtectCheck       = domSelectedExtension.querySelector( dirProtectCheckSelector       );
      const dirProtectCheckLabel  = domSelectedExtension.querySelector( dirProtectCheckLabelSelector  ); // use nextElementSibling
      const readOnlyCheck         = domSelectedExtension.querySelector( readOnlyCheckSelector         );
      const readOnlyCheckLabel    = domSelectedExtension.querySelector( readOnlyCheckLabelSelector    ); // use nextElementSibling
      const removeButton          = domSelectedExtension.querySelector( removeButtonSelector          );

      var uiError = false;

      if (! allowAccessCheck) {
        this.error(`FAILED TO GET allowAccessCheck: selector="${allowAccessCheckSelector}"`);
        return;
      }
//////if (! allowAccessCheckLabel) {
////////this.error(`FAILED TO GET allowAccessCheckLabel: selector="${allowAccessCheckLabelSelector}"`);
////////return;
//////}
      if (! readOnlyCheck) {
        this.error(`FAILED TO GET readOnlyCheck: selector="${readOnlyCheckSelector}"`);
        return;
      }
      if (! readOnlyCheckLabel) {
        this.error(`FAILED TO GET readOnlyCheckLabel: selector="${readOnlyCheckLabelSelector}"`);
        return;
      }
      if (! editButton) {
        this.error(`FAILED TO GET editButton: selector="${editButtonSelector}"`);
        uiError = true;
      }
      if (! noQuotaCheck) {
        this.error(`FAILED TO GET noQuotaCheck: selector="${noQuotaCheckSelector}"`);
        uiError = true;
      }
      if (! noQuotaCheckLabel) {
        this.error(`FAILED TO GET noQuotaCheckLabel: selector="${noQuotaCheckLabelSelector}"`);
        uiError = true;
      }
//    if (! lockCheck) {
//      this.error(`FAILED TO GET lockCheck: selector="${lockCheckSelector}"`);
//      uiError = true;
//    }
//    if (! lockCheckLabel) {
//      this.error(`FAILED TO GET lockCheckLabel: selector="${lockCheckLabelSelector}"`);
//      uiError = true;
//    }
      if (! dirProtectCheck) {
        this.error(`FAILED TO GET dirProtectCheck: selector="${dirProtectCheckSelector}"`);
        uiError = true;
      }
      if (! dirProtectCheckLabel) {
        this.error(`FAILED TO GET dirProtectCheckLabel: selector="${dirProtectCheckLabelSelector}"`);
        uiError = true;
      }
      if (! removeButton) {
        this.error(`FAILED TO GET removeButton: selector="${removeButtonSelector}"`);
        uiError = true;
      }

      if (uiError) return;

      // Don't need to worry about SPECIAL because this checkbox SHOULD have been DISABLED - AND we guard against this ABOVE!!!

      if (locked) {
        this.debug("(lock) -- adding class \"extension-locked\"");
        domSelectedExtension.classList.add("extension-locked");

        // Disable Buttons and Checkboxes
        allowAccessCheck.disabled = true;
        readOnlyCheck.disabled    = true;
        editButton.disabled       = true;
        noQuotaCheck.disabled     = true;
////////lockCheck.disabled        = true; // don't want to disable ourself...
        dirProtectCheck.disabled  = true;
        removeButton.disabled     = true;
      
        lockCheck.setAttribute(             "title", this.#tooltip_checkbox_lock_enabled_checked        );
        lockCheckLabel.setAttribute(        "title", this.#tooltip_checkbox_lock_enabled_checked        );

        // Change Tooltips to match Disabled State
        allowAccessCheck.setAttribute(      "title", this.#tooltip_checkbox_allowAccess_disabled_locked );
////////allowAccessCheckLabel.setAttribute( "title", this.#tooltip_checkbox_allowAccess_disabled_locked );
        readOnlyCheck.setAttribute(         "title", this.#tooltip_checkbox_readOnly_disabled_locked    );
        readOnlyCheckLabel.setAttribute(    "title", this.#tooltip_checkbox_readOnly_disabled_locked    );
        editButton.setAttribute(            "title", this.#tooltip_button_edit_disabled_locked          );
        noQuotaCheck.setAttribute(          "title", this.#tooltip_checkbox_noQuota_disabled_locked     );
        noQuotaCheckLabel.setAttribute(     "title", this.#tooltip_checkbox_noQuota_disabled_locked     );
        dirProtectCheck.setAttribute(       "title", this.#tooltip_checkbox_dirProtect_disabled_locked  );
        dirProtectCheckLabel.setAttribute(  "title", this.#tooltip_checkbox_dirProtect_disabled_locked  );
        removeButton.setAttribute(          "title", this.#tooltip_button_remove_disabled_locked        );

      } else {
        this.debug("(lock) -- removing class \"extension-locked\"");
        domSelectedExtension.classList.remove("extension-locked");

        const allowAccessChecked = allowAccessCheck.checked;
        const readOnlyChecked    = allowAccessChecked && readOnlyCheck.checked; // <----------------------------------------------------------<<<<<
        const noQuotaChecked     = noQuotaCheck.checked;
////////const lockedChecked      = lockCheck.checked;
        const dirProtectChecked  = dirProtectCheck.checked;

        // Enable Buttons and Checkboxes
        allowAccessCheck.disabled = false;
        readOnlyCheck.disabled    = ! allowAccessChecked; // only if allowAccess is checked
        editButton.disabled       = false;
        noQuotaCheck.disabled     = false;
////////lockCheck.disabled        = false;
        dirProtectCheck.disabled  = false;
        removeButton.disabled     = false;
      
        lockCheck.setAttribute(               "title", this.#tooltip_checkbox_lock_enabled_unchecked ); // not checked
        lockCheckLabel.setAttribute(          "title", this.#tooltip_checkbox_lock_enabled_unchecked ); // not checked

        // Change Tooltips to match Enabled State
        if (allowAccessChecked) {
          allowAccessCheck.setAttribute(      "title", this.#tooltip_checkbox_allowAccess_enabled_checked );
//////////allowAccessCheckLabel.setAttribute( "title", this.#tooltip_checkbox_allowAccess_enabled_checked );
          if (readOnlyChecked) {
            readOnlyCheck.setAttribute(         "title", this.#tooltip_checkbox_readOnly_enabled_checked );
            readOnlyCheckLabel.setAttribute(    "title", this.#tooltip_checkbox_readOnly_enabled_checked );
          } else {
            readOnlyCheck.setAttribute(         "title", this.#tooltip_checkbox_readOnly_enabled_unchecked );
            readOnlyCheckLabel.setAttribute(    "title", this.#tooltip_checkbox_readOnly_enabled_unchecked );
          }
        } else {
          allowAccessCheck.setAttribute(      "title", this.#tooltip_checkbox_allowAccess_enabled_unchecked );
//////////allowAccessCheckLabel.setAttribute( "title", this.#tooltip_checkbox_allowAccess_enabled_unchecked );
          readOnlyCheck.setAttribute(         "title", this.#tooltip_checkbox_readOnly_disabled_accessDisallowed );
          readOnlyCheckLabel.setAttribute(    "title", this.#tooltip_checkbox_readOnly_disabled_accessDisallowed );
        }

        editButton.setAttribute(              "title", this.#tooltip_button_edit_enabled );

        if (noQuotaChecked) {
           noQuotaCheck.setAttribute(          "title", this.#tooltip_checkbox_noQuota_enabled_checked );
           noQuotaCheckLabel.setAttribute(     "title", this.#tooltip_checkbox_noQuota_enabled_checked );
        } else {
           noQuotaCheck.setAttribute(          "title", this.#tooltip_checkbox_noQuota_enabled_unchecked );
           noQuotaCheckLabel.setAttribute(     "title", this.#tooltip_checkbox_noQuota_enabled_unchecked );
        }

////////if (lockedChecked) {
////////  lockCheck.setAttribute(             "title", this.#tooltip_checkbox_lock_enabled_checked );
////////  lockCheckLabel.setAttribute(        "title", this.#tooltip_checkbox_lock_enabled_checked );
////////} else {
////////  lockCheck.setAttribute(             "title", this.#tooltip_checkbox_lock_enabled_unchecked );
////////  lockCheckLabel.setAttribute(        "title", this.#tooltip_checkbox_lock_enabled_unchecked );
////////}

        if (dirProtectChecked) {
          dirProtectCheck.setAttribute(       "title", this.#tooltip_checkbox_dirProtect_enabled_checked );
          dirProtectCheckLabel.setAttribute(  "title", this.#tooltip_checkbox_dirProtect_enabled_checked );
        } else {
          dirProtectCheck.setAttribute(       "title", this.#tooltip_checkbox_dirProtect_enabled_unchecked );
          dirProtectCheckLabel.setAttribute(  "title", this.#tooltip_checkbox_dirProtect_enabled_unchecked );
        }

        removeButton.setAttribute(            "title", this.#tooltip_button_remove_enabled );
      }
    }

    this.debug("-- end");
  }



  async #extDirProtectCheckboxClicked(e, extensionId, extProps, dirProtect) {
    this.debug(`-- OLD PROPS: extProps.id="${extProps.id}" extProps.name="${extProps.name}" dirProtect=${extProps.dirProtect}`);
    this.debug(`-- NEW dirProtect=${dirProtect}`);

    this.#resetErrors();
    this.#resetMessages();

    // find the TR.extension-list-item and set the classes and/or attributes
    const dirProtectCheck       = e.target;
    const dirProtectCheckLabel  = dirProtectCheck.nextElementSibling;

    const extensionSelector     = `tr.extension-list-item[extensionId='${extensionId}']`
    const domSelectedExtension  = document.querySelector(extensionSelector);

    if (! domSelectedExtension) {
      this.error(`(dirProtect) -- DID NOT FIND OUR extension-list-item: "${extensionSelector}"`);

    } else if (domSelectedExtension.classList.contains("extension-special")) { // MABXXX verify with extProps
      this.error(`-- Cannot change dirProtect State - extension is SPECIAL`);

    } else if (domSelectedExtension.classList.contains("extension-locked")) { // MABXXX verify with extProps
      this.error(`-- Cannot change dirProtect State - extension is LOCKED`);

    } else {
      this.debug(`(dirProtect) -- Found our extension-list-item: "${extensionSelector}"`);

      extProps['dirProtect'] = dirProtect;
      this.debug("-- new dirProtect checkbox status: ", extProps);

      await this.#fsbOptionsApi.storeExtensionPropsById(extensionId, extProps);

      if (dirProtect) {
        this.debug("(dirProtect) -- adding class \"extension-dir-protect\"");
        domSelectedExtension.classList.add("extension-dir-protect");
        dirProtectCheck.setAttribute(      "title", this.#tooltip_checkbox_dirProtect_enabled_checked );
        dirProtectCheckLabel.setAttribute( "title", this.#tooltip_checkbox_dirProtect_enabled_checked );
      } else {
        this.debug("(dirProtect) -- removing class \"extension-dir-protect\"");
        domSelectedExtension.classList.remove("extension-dir-protect");
        dirProtectCheck.setAttribute(      "title", this.#tooltip_checkbox_dirProtect_enabled_unchecked );
        dirProtectCheckLabel.setAttribute( "title", this.#tooltip_checkbox_dirProtect_enabled_unchecked );
      }
    }

    this.debug("-- end");
  }




  // Something on the Page was clicked.
  //
  // Check to see if an Action button was clicked - refesh, allow/disallow all, allow/disallow selected, add, remove selected, etc
  // or a label was clicked, so check it has a for="" attribute,
  // or an open-close-widget <SPAN> was clicked
  // or the extension settings title <DIV> was clicked
  //
  //
  // NOTE: This listener is set on the DOCUMENT!!!
  async #actionClicked(e) {
    this.debug('--');
    if (e === null) return;

    this.#resetErrors();
    this.#resetMessages();

    this.debug(`-- tagName="${e.target.tagName}" id="${e.target.id}"`);

    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'LABEL') {
      this.debug(`-- BUTTON OR LABEL CLICKED tagName="${e.target.tagName}" id="${e.target.id}"`);

      // I thought the browser was supposed to take care of this <label> with a "for" attribute stuff...
      if (e.target.tagName === 'LABEL' && (! e.target.parentElement || e.target.parentElement.tagName !== 'BUTTON')) {
        // ignore it - let #optionChanged() handle it
        this.debug(`-- LABEL CLICKED, but it has no parentElement or its parentElement is not a BUTTON`);

      } else {
        e.preventDefault();

        var button;
        if (e.target.tagName === 'LABEL') {
          button = e.target.parentElement;
        } else {
          button = e.target;
        }

        const buttonId = button.id;
        this.debug(`-- BUTTON CLICKED id="${buttonId}"`);

        if (! buttonId) {
          this.debug("-- BUTTON has no ID");

        } else {
          switch (buttonId) {
            case "fsbRefreshListButton":
              await this.#refreshExtensionListUI(e);
              break;
            case "fsbAllowAllButton":
              await this.#allowAccessAllExtensions(e);
              break;
            case "fsbDisallowAllButton":
              await this.#disallowAccessAllExtensions(e);
              break;
            case "fsbAllowSelectedButton":
              await this.#allowAccessSelectedExtensions(e);
              break;
            case "fsbDisallowSelectedButton":
              await this.#disallowAccessSelectedExtensions(e);
              break;
            case "fsbAddNewExtensionButton":
              await this.#addNewExtension(e);
              break;
            case "fsbAddInstalledExtensionsButton":
              await this.#selectAndAddInstalledExtensions(e);
              break;
            case "fsbShowBackupManagerButton":
              await this.#showBackupManager(e);
              break;
            case "fsbShowEventLogManagerButton":
              await this.#showEventLogManager(e);
              break;
            case "fsbShowStorageManagerButton":
              await this.#showStorageManager(e);
              break;
            case "fsbDeleteSelectedButton":
              await this.#removeSelectedExtensions(e);
              break;
            case "fsbOptionsDoneButton":
              await this.#doneButtonClicked(e);
              break;
            default:
              this.debug(`-- NOT A BUTTON WE CARE ABOUT -- id="${buttonId}"`);
          }
        }
      }

    } else if (e.target.tagName === "SPAN") {
      const span   = e.target;
      const spanId = span.id;

      this.debug(`-- SPAN Clicked id="${spanId}", classList:`, span.classList);

      if (span.classList.contains("open-close-widget")) {
        await this.#openCloseWidgetSpanClicked(e, span);
      } else {
        this.debug(`-- NOT A SPAN WE CARE ABOUT -- id="${spanId}", classList:`, span.classList);
      }

    } else if (e.target.tagName === "DIV") {
      const div   = e.target;
      const divId = div.id;

      this.debug(`-- DIV Clicked id="${divId}", classList:`, div.classList);

      if (divId === "fsbExtensionOptionsTitle") {
        await this.#extensionOptionsTitleDivClicked(e, div);
      } else {
        this.debug(`-- NOT A DIV WE CARE ABOUT -- id="${divId}", classList:`, div.classList);
      }
    } else {
      // otherwise we don't care about this click
    }
  }



  async #extensionOptionsTitleDivClicked(e, div) {
    this.#resetErrors();
    this.#resetMessages();

    this.#extensionOptionsTitleClickTimeout = setTimeout(() => this.#extensionOptionsTitleDivSingleClicked(e, div), this.#EXTENSION_OPTIONS_TITLE_CLICK_DELAY);
  }

  // Should be called ONLY when the this.#extensionOptionsTitleClickTimeout has timed out
  async #extensionOptionsTitleDivSingleClicked(e, div) {
    if (this.#extensionOptionsTitleClickTimeout) {
      const timeout = this.#extensionOptionsTitleClickTimeout;
      this.#extensionOptionsTitleClickTimeout = null;
      clearTimeout(timeout);
    }

    if (! e) return;

    // nothing to do - we care only about the double-click
  }

  async #extensionOptionsTitleDivDoubleClicked(e) {
    if (! e) return;

    this.#resetErrors();
    this.#resetMessages();

    if (e.target.tagName === "DIV") {
      const divId = e.target.id;

      if (divId === "fsbExtensionOptionsTitle") {
        if (this.#extensionOptionsTitleClickTimeout) {
          const timeout = this.#extensionOptionsTitleClickTimeout;
          this.#extensionOptionsTitleClickTimeout = null;
          clearTimeout(timeout);
        }

        const isEnabledShowDeveloperOptions = await this.#fsbOptionsApi.isEnabledOption("fsbShowDeveloperOptions");
        this.debug(`-- Extension Options DIV Double-Clicked isEnabledShowDeveloperOptions=${isEnabledShowDeveloperOptions}`);

        if (isEnabledShowDeveloperOptions) {
          // Developer Options ARE currently displayed, so remove them
          this.#removeDeveloperOptions();
        } else {
          // Developer Options are NOT currently displayed, so add them
          await this.#addDeveloperOptions();
        }

        await this.#fsbOptionsApi.saveOption("fsbShowDeveloperOptions", ! isEnabledShowDeveloperOptions); // flip the option
      }
    }
  }



  async #resetOptionsButtonClicked(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    this.#resetErrors();
    this.#resetMessages();

    this.debug("-- start");

    await this.#fsbOptionsApi.resetOptions();
    await this.#buildUI();

    this.debug("-- end");
  }



  async #displayOptionsAsPopupButtonClicked(e) {
    e.preventDefault();

    this.#resetErrors();
    this.#resetMessages();

    this.#showPopupWindow(this.#CLASS_NAME);
  }



  async #runSelfTestButtonClicked(e) {
    e.preventDefault();

    this.#resetErrors();
    this.#resetMessages();

    const fsbSelfTestApi  = new FileSystemBrokerSelfTests(this.#logger);

    await fsbSelfTestApi.runSelfTests();
  }



  async #deleteOldEventLogsButtonClicked(e) {
    e.preventDefault();

    this.#resetErrors();
    this.#resetMessages();

    var numDays = 7;
    const numDaysInput = document.getElementById("fsbDeleteOldEventLogsNumDays");
    if (numDaysInput) {
      numDays = +numDaysInput.value;
    }

    var numMinutes = 0;
    const numMinutesInput = document.getElementById("fsbDeleteOldEventLogsNumMinutes");
    if (numMinutesInput) {
      numMinutes = +numMinutesInput.value; // the + convierts to type number
    }

    var numSeconds = 0;
    const numSecondsInput = document.getElementById("fsbDeleteOldEventLogsNumSeconds");
    if (numSecondsInput) {
      numSeconds = +numSecondsInput.value; // the + convierts to type number
    }

    const delayMS = (numMinutes * 60000) + (numSeconds * 1000);

    if (delayMS === 0) {
      this.logAlways(`-- Deleting Log Files more than ${numDays} days old`);
      await this.#fsbEventLogger.deleteOldEventLogs(numDays);

    } else {
      this.logAlways(`-- Setting DeleteOldEventLogs timeout for ${numMinutes} minutes and ${numSeconds} seconds -- ${delayMS} ms`);
      this.#devDeleteOldEventLogsTimeout = setTimeout( () => this.#devDeleteOldEventLogsTimeoutTimedOut(delayMS, numDays), delayMS);
    }
  }

  async #devDeleteOldEventLogsTimeoutTimedOut(delayMS, numDays) {
    const timeout = this.#devDeleteOldEventLogsTimeout;
    this.#devDeleteOldEventLogsTimeout = null;
    if (timeout) {
      clearTimeout(timeout);
    }

    this.logAlways(`-- Timed out after ${delayMS} ms -- Deleting Log Files more than ${numDays} days old`);
    await this.#fsbEventLogger.deleteOldEventLogs(numDays);
  }



  async #removeUninstalledExtensionsButtonClicked(e) {
    e.preventDefault();

    this.#resetErrors();
    this.#resetMessages();

    var numDays = 2;
    const numDaysInput = document.getElementById("fsbRemoveUninstalledExtensionsNumDays");
    if (numDaysInput) {
      numDays = +numDaysInput.value;
    }

    var numMinutes = 0;
    const numMinutesInput = document.getElementById("fsbRemoveUninstalledExtensionsNumMinutes");
    if (numMinutesInput) {
      numMinutes = +numMinutesInput.value;
    }

    var numSeconds = 0;
    const numSecondsInput = document.getElementById("fsbRemoveUninstalledExtensionsNumSeconds");
    if (numSecondsInput) {
      numSeconds = +numSecondsInput.value; // the + convierts to type number
    }

    const delayMS = (numMinutes * 60000) + (numSeconds * 1000);

    if (delayMS === 0) {
      this.logAlways(`-- Removing Extensions uninstalled more than ${numDays} days ago`);
      await this.#fsbOptionsApi.autoRemoveUninstalledExtensions(numDays);

    } else {
      this.logAlways(`-- Setting RemoveUninstalledExtensions timeout for ${numMinutes} minutes and ${numSeconds} seconds -- ${delayMS} ms`);
      this.#devRemoveUninstalledExtensionsTimeout = setTimeout( () => this.#devRemoveUninstalledExtensionsTimeoutTimedOut(delayMS, numDays), delayMS);
    }
  }

  async #devRemoveUninstalledExtensionsTimeoutTimedOut(delayMS, numDays) {
    const timeout = this.#devRemoveUninstalledExtensionsTimeout;
    this.#devRemoveUninstalledExtensionsTimeout = null;
    if (timeout) {
      clearTimeout(timeout);
    }

    this.logAlways(`-- Timed out after ${delayMS} ms -- Removing Extensions uninstalled more than ${numDays} days ago`);
    await this.#fsbOptionsApi.autoRemoveUninstalledExtensions(numDays);
  }



  async #addDeveloperOptions(e) {
    this.debug("-- start");

    const fsbDeveloperOptionsDiv = document.getElementById("fsbDeveloperOptions");
    if (fsbDeveloperOptionsDiv) {
      // developer options aready there, nothing to do (restore options from backup would cause this)
    } else {
      const accessLoggingEnabled                = await this.#fsbOptionsApi.isEnabledAccessLogging();
      const accessDeniedLoggingEnabled          = await this.#fsbOptionsApi.isEnabledAccessDeniedLogging();
      const internalMessageLoggingEnabled       = await this.#fsbOptionsApi.isEnabledInternalMessageLogging();
      const internalMessageResultLoggingEnabled = await this.#fsbOptionsApi.isEnabledInternalMessageResultLogging();
      const externalMessageLoggingEnabled       = await this.#fsbOptionsApi.isEnabledExternalMessageLogging();
      const externalMessageResultLoggingEnabled = await this.#fsbOptionsApi.isEnabledExternalMessageResultLogging();
      const skipOnboardingEnabled               = await this.#fsbOptionsApi.isEnabledSkipOnboarding();
      const showOptionsWindowOnStartupEnabled   = await this.#fsbOptionsApi.isEnabledShowOptionsWindowOnStartup();

      const fsbExtensionOptionsDiv = document.getElementById("fsbExtensionOptions");

      const devloperOptionsDiv =  document.createElement("div");
        devloperOptionsDiv.setAttribute("id", "fsbDeveloperOptions");

        const titleDiv = document.createElement("div");
          const titleLabel = document.createElement("label");
            titleLabel.appendChild( document.createTextNode(this.#i18n_label_dev_options_title) );
          titleDiv.appendChild(titleLabel);
        devloperOptionsDiv.appendChild(titleDiv);

/*      const logAccessDiv = document.createElement("div");
          logAccessDiv.classList.add("option-panel");
          logAccessDiv.classList.add("dev-option-panel");
          const logAccessCheck = document.createElement("input");
            logAccessCheck.setAttribute("type", "checkbox");
            logAccessCheck.setAttribute("id", "fsbEnableAccessLogging");  // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            logAccessCheck.classList.add("fsbGeneralOption");                    // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED -------<<<<<
            logAccessCheck.checked = accessLoggingEnabled;
          logAccessDiv.appendChild(logAccessCheck);
          const logAccessLabel = document.createElement("label");
            logAccessLabel.setAttribute("for", "fsbEnableAccessLogging"); // <------- MUST MATCH OPTION NAME
            logAccessLabel.setAttribute("data-l10n-id", "options_fsbDevEnableAccessLoggingCheck.label"); // update _locales/<lang>/messages.json
            const logAccessLabelText = utils.getI18nMsg("options_fsbDevEnableAccessLoggingCheck.label");
            logAccessLabel.appendChild( document.createTextNode(this.#i18n_check_dev_logAccess) );
          logAccessDiv.appendChild(logAccessLabel);
        devloperOptionsDiv.appendChild(logAccessDiv);
*/
        // show the onboarding page on extension startup
        const skipOnboardingDiv = document.createElement("div");
          skipOnboardingDiv.classList.add("option-panel");
          skipOnboardingDiv.classList.add("dev-option-panel");
          const skipOnboardingCheck = document.createElement("input");
            skipOnboardingCheck.setAttribute("type", "checkbox");
            skipOnboardingCheck.setAttribute("id", "fsbSkipOnboardingEnabled");                           // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            skipOnboardingCheck.classList.add("fsbGeneralOption");                                 // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED -------<<<<<
            skipOnboardingCheck.checked = skipOnboardingEnabled;
          skipOnboardingDiv.appendChild(skipOnboardingCheck);
          const skipOnboardingLabel = document.createElement("label");
            skipOnboardingLabel.setAttribute("for", "fsbSkipOnboardingEnabled");                           // <------- MUST MATCH OPTION NAME
            skipOnboardingLabel.setAttribute("data-l10n-id", "options_fsbDevSkipOnboardingCheck.label");
            skipOnboardingLabel.appendChild( document.createTextNode(this.#i18n_check_dev_skipOnboarding) );
          skipOnboardingDiv.appendChild(skipOnboardingLabel);
        devloperOptionsDiv.appendChild(skipOnboardingDiv);

        // show the options as a pop window on extension startup
        const showOptionsWindowOnStartupDiv = document.createElement("div");
          showOptionsWindowOnStartupDiv.classList.add("option-panel");
          showOptionsWindowOnStartupDiv.classList.add("dev-option-panel");
          const showOptionsWindowOnStartupCheck = document.createElement("input");
            showOptionsWindowOnStartupCheck.setAttribute("type", "checkbox");
            showOptionsWindowOnStartupCheck.setAttribute("id", "fsbShowOptionsWindowOnStartup"); // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            showOptionsWindowOnStartupCheck.classList.add("fsbGeneralOption");                   // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED -------<<<<<
            showOptionsWindowOnStartupCheck.checked = showOptionsWindowOnStartupEnabled;
          showOptionsWindowOnStartupDiv.appendChild(showOptionsWindowOnStartupCheck);
          const showOptionsWindowOnStartupLabel = document.createElement("label");
            showOptionsWindowOnStartupLabel.setAttribute("for", "fsbShowOptionsWindowOnStartup"); // <------- MUST MATCH OPTION NAME
            showOptionsWindowOnStartupLabel.setAttribute("data-l10n-id", "options_fsbDevShowOptionsWindowOnStartupCheck.label");
            showOptionsWindowOnStartupLabel.appendChild( document.createTextNode(this.#i18n_check_dev_showOptionsWindowOnStartup) );
          showOptionsWindowOnStartupDiv.appendChild(showOptionsWindowOnStartupLabel);
        devloperOptionsDiv.appendChild(showOptionsWindowOnStartupDiv);

/*
        const showOptionsWindowOnStartupDiv = document.createElement("div");
          showOptionsWindowOnStartupDiv.classList.add("option-panel");
          showOptionsWindowOnStartupDiv.classList.add("dev-option-panel");
          const showOptionsWindowOnStartupCheck = document.createElement("input");
            showOptionsWindowOnStartupCheck.setAttribute("type", "checkbox");
            showOptionsWindowOnStartupCheck.setAttribute("id", "fsbShowOptionsWindowOnStartup");  // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            showOptionsWindowOnStartupCheck.classList.add("fsbGeneralOption");                    // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED -------<<<<<
            showOptionsWindowOnStartupCheck.checked = showOptionsWindowOnStartupEnabled;
          showOptionsWindowOnStartupDiv.appendChild(showOptionsWindowOnStartupCheck);
          const showOptionsWindowOnStartupLabel = document.createElement("label");
            showOptionsWindowOnStartupLabel.setAttribute("for", "fsbShowOptionsWindowOnStartup"); // <------- MUST MATCH OPTION NAME
            showOptionsWindowOnStartupLabel.setAttribute("data-l10n-id", "options_fsbSkipOnboardingCheck.label"); // update _locales/<lang>/messages.json
            const showOptionsWindowOnStartupLabelText = utils.getI18nMsg("options_fsbSkipOnboardingCheck.label");
            showOptionsWindowOnStartupLabel.appendChild( document.createTextNode(showOptionsWindowOnStartupLabelText) );
          showOptionsWindowOnStartupDiv.appendChild(showOptionsWindowOnStartupLabel);
        devloperOptionsDiv.appendChild(showOptionsWindowOnStartupDiv);
*/
        const devButtonPanel = document.createElement("div");
          devButtonPanel.setAttribute("id", "fsbDevButtonPanel");
          devButtonPanel.classList.add( "option-panel"     );
          devButtonPanel.classList.add( "dev-option-panel" );
          devButtonPanel.classList.add( "dev-button-panel" );
          devButtonPanel.style.setProperty( "margin-top",      "1.0em" );

          const resetOptionsButton = document.createElement("button");
            resetOptionsButton.setAttribute("id", "fsbResetOptions");
            resetOptionsButton.addEventListener("click", (e) => this.#resetOptionsButtonClicked(e));

            const resetOptionsButtonLabel = document.createElement("label");
              resetOptionsButtonLabel.setAttribute( "id",           "fsbResetOptionsLabel"                   );
              resetOptionsButtonLabel.setAttribute( "for",          "fsbResetOptions"                        );
              resetOptionsButtonLabel.setAttribute( "data-l10n-id", "options_fsbDevResetOptionsButton.label" );
              resetOptionsButtonLabel.appendChild( document.createTextNode(this.#i18n_button_dev_resetOptions) );
            resetOptionsButton.appendChild(resetOptionsButtonLabel);
          devButtonPanel.appendChild(resetOptionsButton);

          const runFilesystemBrokerTestsButton = document.createElement("button");
            runFilesystemBrokerTestsButton.setAttribute("id", "fsbRunSelfTest");
            runFilesystemBrokerTestsButton.addEventListener("click", (e) => this.#runSelfTestButtonClicked(e));

            const runFilesystemBrokerTestsButtonLabel = document.createElement("label");
              runFilesystemBrokerTestsButtonLabel.setAttribute( "id",           "fsbRunSelfTestsLabel"                );
              runFilesystemBrokerTestsButtonLabel.setAttribute( "for",          "fsbRunSelfTest"                      );
              runFilesystemBrokerTestsButtonLabel.setAttribute( "data-l10n-id", "options_fsbDevSelfTestsButton.label" );
              runFilesystemBrokerTestsButtonLabel.appendChild( document.createTextNode(this.#i18n_button_dev_runSelfTest) );
            runFilesystemBrokerTestsButton.appendChild(runFilesystemBrokerTestsButtonLabel);
          devButtonPanel.appendChild(runFilesystemBrokerTestsButton);

          if (! this.#windowMode) {
            const displayOptionsAsPopupButton = document.createElement("button");
              displayOptionsAsPopupButton.setAttribute("id", "fsbDisplayOptionsAsPopup");
              displayOptionsAsPopupButton.addEventListener("click", (e) => this.#displayOptionsAsPopupButtonClicked(e), true); // true: capturing phase

              const displayOptionsAsPopupButtonLabel = document.createElement("label");
                displayOptionsAsPopupButtonLabel.setAttribute( "id",           "fsbDisplayOptionsAsPopupLabel"                );
                displayOptionsAsPopupButtonLabel.setAttribute( "for",          "fsbDisplayOptionsAsPopup"                     );
                displayOptionsAsPopupButtonLabel.setAttribute( "data-l10n-id", "options_fsbDisplayOptionsAsPopupButton.label" );
                displayOptionsAsPopupButtonLabel.appendChild( document.createTextNode(this.#i18n_button_dev_displayOptionsAsPopup) );
              displayOptionsAsPopupButton.appendChild(displayOptionsAsPopupButtonLabel);
            devButtonPanel.appendChild(displayOptionsAsPopupButton);
          }

        devloperOptionsDiv.appendChild(devButtonPanel);

        const devActionsPanel = document.createElement("div");
          devActionsPanel.setAttribute("id", "fsbDevActionsPanel");
          devActionsPanel.classList.add( "option-panel"     );
          devActionsPanel.classList.add( "dev-option-panel" );
          devActionsPanel.style.setProperty( "display",         "flex"   );
          devActionsPanel.style.setProperty( "justify-content", "center" ); /* Centers the content horizontally */
          devActionsPanel.style.setProperty( "align-items",     "center" ); /* Optional: Centers vertically if container has height */
          devActionsPanel.style.setProperty( "margin-top",      "1.0em" );

          const devActionsTable = document.createElement("table");
//          devActionsTable.style.setProperty( "margin-top",  "1.0em" );
//          devActionsTable.style.setProperty( "margin-left", "2.0em" );

            var td

            const deleteOldEventLogsTR = document.createElement("tr");
              td =  document.createElement("td");
                td.style.setProperty("text-align", "right");
                const deleteOldEventLogsButton = document.createElement("button");
                  deleteOldEventLogsButton.setAttribute("id", "fsbDeleteOldEventLogs");
                  deleteOldEventLogsButton.addEventListener("click", (e) => this.#deleteOldEventLogsButtonClicked(e));

                  const deleteOldEventLogsButtonLabel = document.createElement("label");
                    deleteOldEventLogsButtonLabel.setAttribute( "id",           "fsbDeleteOldEventLogsButtonLabel"             );
                    deleteOldEventLogsButtonLabel.setAttribute( "for",          "fsbDeleteOldEventLogs"                        );
                    deleteOldEventLogsButtonLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsButton.label" );
                    deleteOldEventLogsButtonLabel.appendChild( document.createTextNode(this.#i18n_button_dev_deleteOldEventLogs) );
                  deleteOldEventLogsButton.appendChild(deleteOldEventLogsButtonLabel);
                td.appendChild(deleteOldEventLogsButton);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "right");
                const deleteOldEventLogsOlderThanNumDaysLabel = document.createElement("label");
                  deleteOldEventLogsOlderThanNumDaysLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsOlderThanNumDaysLabel" );
                  deleteOldEventLogsOlderThanNumDaysLabel.appendChild( document.createTextNode(this.#i18n_label_dev_deleteOldEventLogsOlderThanNumDaysLabel) );
                td.appendChild(deleteOldEventLogsOlderThanNumDaysLabel);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("padding", "0");
                const deleteOldEventLogsNumDaysInput = document.createElement("input");
                  deleteOldEventLogsNumDaysInput.setAttribute( "type",      "number"                       );
//                deleteOldEventLogsNumDaysInput.setAttribute( "readonly",  true                           );
                  deleteOldEventLogsNumDaysInput.setAttribute( "id",        "fsbDeleteOldEventLogsNumDays" );
                  deleteOldEventLogsNumDaysInput.setAttribute( "min",       1                              );
                  deleteOldEventLogsNumDaysInput.setAttribute( "max",       30                             );
                  deleteOldEventLogsNumDaysInput.setAttribute( "max_chars", 2                              );
                  deleteOldEventLogsNumDaysInput.style.setProperty("width", "5ch");
                  deleteOldEventLogsNumDaysInput.classList.add( "no-css"             );  // Tell userContent.css NOT to change me!!!
                  deleteOldEventLogsNumDaysInput.classList.add( "arrow-up-down-only" );
                  deleteOldEventLogsNumDaysInput.addEventListener( 'keydown', (e) => this.#inputKeyPressed(e) );
                  deleteOldEventLogsNumDaysInput.value = 7;
                td.appendChild(deleteOldEventLogsNumDaysInput);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "left");
                const deleteOldEventLogsOlderThanDaysLabel = document.createElement("label");
                  deleteOldEventLogsOlderThanDaysLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsOlderThanDaysLabel" );
                  deleteOldEventLogsOlderThanDaysLabel.appendChild( document.createTextNode(this.#i18n_label_dev_deleteOldEventLogsOlderThanDaysLabel) );
                td.appendChild(deleteOldEventLogsOlderThanDaysLabel);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty( "text-align",   "right" );
                td.style.setProperty( "padding-left", "0.5em" );
                const deleteOldEventLogsInNumMinutesLabel = document.createElement("label");
                  deleteOldEventLogsInNumMinutesLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsInNumMinutesLabel" );
                  deleteOldEventLogsInNumMinutesLabel.appendChild( document.createTextNode(this.#i18n_label_dev_deleteOldEventLogsInNumMinutesLabel) );
                td.appendChild(deleteOldEventLogsInNumMinutesLabel);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("padding", "0");
                const deleteOldEventLogsNumMinutesInput = document.createElement("input");
                  deleteOldEventLogsNumMinutesInput.setAttribute( "type",      "number"                          );
//                deleteOldEventLogsNumMinutesInput.setAttribute( "readonly",  true                              );
                  deleteOldEventLogsNumMinutesInput.setAttribute( "id",        "fsbDeleteOldEventLogsNumMinutes" );
                  deleteOldEventLogsNumMinutesInput.setAttribute( "min",       0                                 );
                  deleteOldEventLogsNumMinutesInput.setAttribute( "max",       5                                 );
                  deleteOldEventLogsNumMinutesInput.setAttribute( "max_chars", 1                                 );
                  deleteOldEventLogsNumMinutesInput.style.setProperty("width", "4ch");
                  deleteOldEventLogsNumMinutesInput.classList.add( "no-css"             );  // Tell userContent.css NOT to change me!!!
                  deleteOldEventLogsNumMinutesInput.classList.add( "arrow-up-down-only" );
                  deleteOldEventLogsNumMinutesInput.addEventListener( 'keydown', (e) => this.#inputKeyPressed(e) );
                  deleteOldEventLogsNumMinutesInput.value = 1;
                td.appendChild(deleteOldEventLogsNumMinutesInput);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "left");
                const deleteOldEventLogsInMinutesLabel = document.createElement("label");
                  deleteOldEventLogsInMinutesLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsInMinutesLabel" );
                  deleteOldEventLogsInMinutesLabel.appendChild( document.createTextNode(this.#i18n_label_dev_deleteOldEventLogsInMinutesLabel) );
                td.appendChild(deleteOldEventLogsInMinutesLabel);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty( "text-align",   "right" );
                td.style.setProperty( "padding-left", "0.5em" );
                const deleteOldEventLogsInNumSecondsLabel = document.createElement("label");
                  deleteOldEventLogsInNumSecondsLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsInNumSecondsLabel" );
                  deleteOldEventLogsInNumSecondsLabel.appendChild( document.createTextNode(this.#i18n_label_dev_deleteOldEventLogsInNumSecondsLabel) );
                td.appendChild(deleteOldEventLogsInNumSecondsLabel);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("padding", "0");
                const deleteOldEventLogsNumSecondsInput = document.createElement("input");
                  deleteOldEventLogsNumSecondsInput.setAttribute( "type",      "number"                          );
//                deleteOldEventLogsNumSecondsInput.setAttribute( "readonly",  true                              );
                  deleteOldEventLogsNumSecondsInput.setAttribute( "id",        "fsbDeleteOldEventLogsNumSeconds" );
                  deleteOldEventLogsNumSecondsInput.setAttribute( "min",       0                                 );
                  deleteOldEventLogsNumSecondsInput.setAttribute( "max",       59                                );
                  deleteOldEventLogsNumSecondsInput.setAttribute( "max_chars", 2                                 );
                  deleteOldEventLogsNumSecondsInput.style.setProperty("width", "5ch");
                  deleteOldEventLogsNumSecondsInput.classList.add( "no-css"             );  // Tell userContent.css NOT to change me!!!
                  deleteOldEventLogsNumSecondsInput.classList.add( "arrow-up-down-only" );
                  deleteOldEventLogsNumSecondsInput.addEventListener( 'keydown', (e) => this.#inputKeyPressed(e) );
                  deleteOldEventLogsNumSecondsInput.value = 0;
                td.appendChild(deleteOldEventLogsNumSecondsInput);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "left");
                const deleteOldEventLogsInSecondsLabel = document.createElement("label");
                  deleteOldEventLogsInSecondsLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsInSecondsLabel" );
                  deleteOldEventLogsInSecondsLabel.appendChild( document.createTextNode(this.#i18n_label_dev_deleteOldEventLogsInSecondsLabel) );
                td.appendChild(deleteOldEventLogsInSecondsLabel);
              deleteOldEventLogsTR.appendChild(td);

            devActionsTable.appendChild(deleteOldEventLogsTR);

            const removeUninstalledExtensionsTR = document.createElement("tr");
              removeUninstalledExtensionsTR.classList.add( "option-panel"     );
              removeUninstalledExtensionsTR.classList.add( "dev-option-panel" );

              td =  document.createElement("td");
                td.style.setProperty("text-align", "right");
                const removeUninstalledExtensionsButton = document.createElement("button");
                  removeUninstalledExtensionsButton.setAttribute("id", "fsbRemoveUninstalledExtensions");
                  removeUninstalledExtensionsButton.addEventListener("click", (e) => this.#removeUninstalledExtensionsButtonClicked(e));

                  const removeUninstalledExtensionsButtonLabel = document.createElement("label");
                    removeUninstalledExtensionsButtonLabel.setAttribute( "id",           "fsbRemoveUninstalledExtensionsButtonLabel"             );
                    removeUninstalledExtensionsButtonLabel.setAttribute( "for",          "fsbRemoveUninstalledExtensions"                        );
                    removeUninstalledExtensionsButtonLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveUninstalledExtensionsButton.label" );
                    removeUninstalledExtensionsButtonLabel.appendChild( document.createTextNode(this.#i18n_button_dev_removeUninstalledExtensions) );
                  removeUninstalledExtensionsButton.appendChild(removeUninstalledExtensionsButtonLabel);
                td.appendChild(removeUninstalledExtensionsButton);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "right");
                const removeExtensionsUninstalledMoreThanNumDaysAgoLabel = document.createElement("label");
                  removeExtensionsUninstalledMoreThanNumDaysAgoLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveExtensionsUninstalledMoreThanNumDaysAgoLabel" );
                  removeExtensionsUninstalledMoreThanNumDaysAgoLabel.appendChild(
                    document.createTextNode(this.#i18n_label_dev_removeExtensionsUninstalledMoreThanNumDaysAgoLabel)
                  );
                td.appendChild(removeExtensionsUninstalledMoreThanNumDaysAgoLabel);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("padding", "0");
                const removeUninstalledExtensionsNumDaysInput = document.createElement("input");
                  removeUninstalledExtensionsNumDaysInput.setAttribute( "type",      "number"                                );
//                removeUninstalledExtensionsNumDaysInput.setAttribute( "readonly",  true                                    );
                  removeUninstalledExtensionsNumDaysInput.setAttribute( "id",        "fsbRemoveUninstalledExtensionsNumDays" );
                  removeUninstalledExtensionsNumDaysInput.setAttribute( "min",       0                                       );
                  removeUninstalledExtensionsNumDaysInput.setAttribute( "max",       30                                      );
                  removeUninstalledExtensionsNumDaysInput.setAttribute( "max_chars", 2                                       );
                  removeUninstalledExtensionsNumDaysInput.style.setProperty("width", "5ch");
                  removeUninstalledExtensionsNumDaysInput.classList.add( "no-css"             );  // Tell userContent.css NOT to change me!!!
                  removeUninstalledExtensionsNumDaysInput.classList.add( "arrow-up-down-only" );
                  removeUninstalledExtensionsNumDaysInput.addEventListener( 'keydown', (e) => this.#inputKeyPressed(e) );
                  removeUninstalledExtensionsNumDaysInput.value = 2;
                td.appendChild(removeUninstalledExtensionsNumDaysInput);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "left");
                const removeExtensionsUninstalledMoreThanDaysAgoLabel = document.createElement("label");
                  removeExtensionsUninstalledMoreThanDaysAgoLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveExtensionsUninstalledMoreThanDaysAgoLabel" );
                  removeExtensionsUninstalledMoreThanDaysAgoLabel.appendChild(
                    document.createTextNode(this.#i18n_label_dev_removeExtensionsUninstalledMoreThanDaysAgoLabel)
                  );
                td.appendChild(removeExtensionsUninstalledMoreThanDaysAgoLabel);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty( "text-align",   "right" );
                td.style.setProperty( "padding-left", "0.5em" );
                const removeUninstalledExtensionsInNumMinutesLabel = document.createElement("label");
                  removeUninstalledExtensionsInNumMinutesLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveUninstalledExtensionsInNumMinutesLabel" );
                  removeUninstalledExtensionsInNumMinutesLabel.appendChild( document.createTextNode(this.#i18n_label_dev_removeUninstalledExtensionsInNumMinutesLabel) );
                td.appendChild(removeUninstalledExtensionsInNumMinutesLabel);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("padding", "0");
                const removeUninstalledExtensionsNumMinutesInput = document.createElement("input");
                  removeUninstalledExtensionsNumMinutesInput.setAttribute( "type",      "number"                                   );
//                removeUninstalledExtensionsNumMinutesInput.setAttribute( "readonly",  true                                       );
                  removeUninstalledExtensionsNumMinutesInput.setAttribute( "id",        "fsbRemoveUninstalledExtensionsNumMinutes" );
                  removeUninstalledExtensionsNumMinutesInput.setAttribute( "min",       0                                          );
                  removeUninstalledExtensionsNumMinutesInput.setAttribute( "max",       5                                          );
                  removeUninstalledExtensionsNumMinutesInput.setAttribute( "max_chars", 1                                          );
                  removeUninstalledExtensionsNumMinutesInput.style.setProperty("width", "4ch");
                  removeUninstalledExtensionsNumMinutesInput.classList.add( "no-css"             );  // Tell userContent.css NOT to change me!!!
                  removeUninstalledExtensionsNumMinutesInput.classList.add( "arrow-up-down-only" );
                  removeUninstalledExtensionsNumMinutesInput.addEventListener( 'keydown', (e) => this.#inputKeyPressed(e) );
                  removeUninstalledExtensionsNumMinutesInput.value = 1;
                td.appendChild(removeUninstalledExtensionsNumMinutesInput);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "left");
                const removeUninstalledExtensionsInMinutesLabel = document.createElement("label");
                  removeUninstalledExtensionsInMinutesLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveUninstalledExtensionsInMinutesLabel" );
                  removeUninstalledExtensionsInMinutesLabel.appendChild( document.createTextNode(this.#i18n_label_dev_removeUninstalledExtensionsInMinutesLabel) );
                td.appendChild(removeUninstalledExtensionsInMinutesLabel);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty( "text-align",   "right" );
                td.style.setProperty( "padding-left", "0.5em" );
                const removeUninstalledExtensionsInNumSecondsLabel = document.createElement("label");
                  removeUninstalledExtensionsInNumSecondsLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveUninstalledExtensionsInNumSecondsLabel" );
                  removeUninstalledExtensionsInNumSecondsLabel.appendChild( document.createTextNode(this.#i18n_label_dev_removeUninstalledExtensionsInNumSecondsLabel) );
                td.appendChild(removeUninstalledExtensionsInNumSecondsLabel);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("padding", "0");
                const removeUninstalledExtensionsNumSecondsInput = document.createElement("input");
                  removeUninstalledExtensionsNumSecondsInput.setAttribute( "type",      "number"                                   );
//                removeUninstalledExtensionsNumSecondsInput.setAttribute( "readonly",  true                                       );
                  removeUninstalledExtensionsNumSecondsInput.setAttribute( "id",        "fsbRemoveUninstalledExtensionsNumSeconds" );
                  removeUninstalledExtensionsNumSecondsInput.setAttribute( "min",       0                                          );
                  removeUninstalledExtensionsNumSecondsInput.setAttribute( "max",       59                                         );
                  removeUninstalledExtensionsNumSecondsInput.setAttribute( "max_chars", 2                                          );
                  removeUninstalledExtensionsNumSecondsInput.style.setProperty("width", "5ch");
                  removeUninstalledExtensionsNumSecondsInput.classList.add( "no-css"             );  // Tell userContent.css NOT to change me!!!
                  removeUninstalledExtensionsNumSecondsInput.classList.add( "arrow-up-down-only" );
                  removeUninstalledExtensionsNumSecondsInput.addEventListener( 'keydown', (e) => this.#inputKeyPressed(e) );
                  removeUninstalledExtensionsNumSecondsInput.value = 0;
                td.appendChild(removeUninstalledExtensionsNumSecondsInput);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "left");
                const removeUninstalledExtensionsInSecondsLabel = document.createElement("label");
                  removeUninstalledExtensionsInSecondsLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveUninstalledExtensionsInSecondsLabel" );
                  removeUninstalledExtensionsInSecondsLabel.appendChild( document.createTextNode(this.#i18n_label_dev_removeUninstalledExtensionsInSecondsLabel) );
                td.appendChild(removeUninstalledExtensionsInSecondsLabel);
              removeUninstalledExtensionsTR.appendChild(td);

            devActionsTable.appendChild(removeUninstalledExtensionsTR);

          devActionsPanel.appendChild(devActionsTable);

        devloperOptionsDiv.appendChild(devActionsPanel);

      fsbExtensionOptionsDiv.appendChild(devloperOptionsDiv);
    }

    this.debug("-- end");
  }



  async #inputKeyPressed(e) {
    if (! e) return;

    if (e.target.tagName === 'INPUT') {
      const input = e.target;
      const value = input.value;

      switch (input.type) {
        case 'text': {
            const maxChars = input.getAttribute("max_chars");
            if (maxChars && input.value) {
              const maxCharsNum = Number(maxChars);
              if (! isNaN(maxCharsNum)) {
                if (input.value.length >= maxCharsNum) {
                  e.preventDefault();
                  return;
                }
              }
            }
          }
          break;

        case 'number': {
            if (input.classList.contains('arrow-up-down-only')) {
              switch (e.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                  break;
                default:
                  e.preventDefault();
                  return;
              }
            }

            const maxChars = input.getAttribute("max_chars");
            const value    = input.value;
            if (maxChars && input.value) {
              const maxCharsNum = Number(maxChars);
              if (! isNaN(maxCharsNum)) {
                if (input.value.length >= maxCharsNum) {
                  e.preventDefault();
                  return;
                }
              }
            }

            if (! utils.eventHasValidNumberInputKey(e)) {
              e.preventDefault();
              return;
            }
          }
          break;
      } /* switch */
    }
  }



  #removeDeveloperOptions(e) {
    const devloperOptionsDiv = document.getElementById("fsbDeveloperOptions");
    if (devloperOptionsDiv) {
      devloperOptionsDiv.remove();
    }
  }



  // and extension-list-item (TR or TD) was clicked
  async #extensionClicked(e) {
////e.stopPropagation();
////e.stopImmediatePropagation();

    this.debug(`-- e.target.tagName="${e.target.tagName}" e.detail=${e.detail}`);

    this.#resetErrors();
    this.#resetMessages();

    if (e.detail === 1 && (e.target.tagName === "TR" || e.target.tagName === "TD")) {
      this.debug("-- TR or TD Clicked");

      var trElement;
      if (e.target.tagName === "TR") {
        trElement = e.target;
      } else if (e.target.tagName === "TD") {
        const tdElement = e.target;
        if (tdElement.parentElement && tdElement.parentElement.tagName === "TR") {
          trElement = tdElement.parentElement;
        }
      } else if (e.target.tagName === "DIV") {
        const divElement = e.target;
        if (divElement.parentElement && divElement.parentElement.tagName === "TD") {
          const tdElement = divElement.parentElement;
          if (tdElement.parentElement && tdElement.parentElement.tagName === "TR") {
            trElement = tdElement.parentElement;
          }
        }
      } else if (e.target.tagName === "SPAN") {
        const spanElement = e.target;
        if (spanElement.parentElement && spanElement.parentElement.tagName === "TD") {
          const tdElement = spanElement.parentElement;
          if (tdElement.parentElement && tdElement.parentElement.tagName === "TR") {
            trElement = tdElement.parentElement;
          }
        }
      }

      if (trElement) {
        const extensionListTable = document.getElementById("fsbExtensionList");
        if (extensionListTable.classList.contains("edit-mode")) {
          this.debug("-- In Edit Mode -- Extensions Selection is Disabled");
          return;
        }

        this.debug("-- Got TR");
        if (trElement.classList.contains("extension-special")) {
          this.debug("-- Extension is SPECIAL");
        } else if (trElement.classList.contains("extension-locked")) {
          this.debug("-- Extension is LOCKED");

        } else {
          if (trElement.classList.contains("extension-list-item")) { // NOTE: not extension-edit-item
            const extensionId = trElement.getAttribute("extensionId");
            this.debug(`-- Got TR.extension-list-item extensionId=${extensionId} EXTENSION_ITEM_CLICK_DELAY=${this.#EXTENSION_ITEM_CLICK_DELAY}`);

            this.#extensionItemClickTimeout = setTimeout(() => this.#extensionSingleClicked(e, trElement), this.#EXTENSION_ITEM_CLICK_DELAY);
          }
        }
      }
    }
  }

  // Should be called ONLY when the extensionIdItemClickTimeout for an extension-list-item (TR or TD) click has timed out
  async #extensionSingleClicked(e, extensionElement) {
    if (this.#extensionItemClickTimeout) {
      const timeout = this.#extensionItemClickTimeout;
      this.#extensionItemClickTimeout = null;
      clearTimeout(timeout);
    }

    if (! e) return;

    if (extensionElement.classList.contains("extension-special")) {
      this.debug("-- Extension is SPECIAL -- Selection is Disabled");
      return;
    }
    if (extensionElement.classList.contains("extension-locked")) {
      this.debug("-- Extension is LOCKED -- Selection is Disabled");
      return;
    }

    const extensionListTable = document.getElementById("fsbExtensionList");
    if (extensionListTable.classList.contains("edit-mode")) {
      this.debug("-- In Edit Mode -- Extensions Selection is Disabled");
      return;
    }

    const extensionId = extensionElement.getAttribute("extensionId");
    const selected    = extensionElement.classList.contains('selected');

    this.debug(`-- Got SINGLE-CLICK ON TR: extensionId=${extensionId} selected=${selected}`);

    if (! selected) {
      extensionElement.classList.add("selected");
    } else {
      extensionElement.classList.remove("selected");
    }

    // If one or more Extension IDs are selected,
    // enable the Buttons that operate on Selected Extension IDs
    // Otherwise disable them
    const allowSelectedButton    = document.getElementById("fsbAllowSelectedButton");
    const disallowSelectedButton = document.getElementById("fsbDisallowSelectedButton");
    const removeSelectedButton   = document.getElementById("fsbDeleteSelectedButton");
    if (this.#getSelectedExtensionCount(e) === 0) {
      allowSelectedButton.disabled    = true;
      disallowSelectedButton.disabled = true;
      removeSelectedButton.disabled   = true;
      allowSelectedButton.setAttribute(    "disabled", "" );
      disallowSelectedButton.setAttribute( "disabled", "" );
      removeSelectedButton.setAttribute(   "disabled", "" );
    } else {
      allowSelectedButton.disabled    = false;
      disallowSelectedButton.disabled = false;
      removeSelectedButton.disabled   = false;
      allowSelectedButton.removeAttribute(    "disabled" );
      disallowSelectedButton.removeAttribute( "disabled" );
      removeSelectedButton.removeAttribute(   "disabled" );
    }
  }

  // and extension-list-item (TR or TD) was double-clicked -> edit the extension
  async #extensionDoubleClicked(e) {
    if (this.#extensionItemClickTimeout) {
      const timeout = this.#extensionItemClickTimeout;
      this.#extensionItemClickTimeout = null;
      clearTimeout(timeout);
    }

    e.stopPropagation();
    e.stopImmediatePropagation();

    this.#resetErrors();
    this.#resetMessages();

    this.debug(`-- e.target.tagName="${e.target.tagName}" e.detail=${e.detail}`);

    if (e.detail === 2 && (e.target.tagName === "TR" || e.target.tagName === "TD")) {
      this.debug("-- TR or TD Double-Clicked");

      var trElement;
      if (e.target.tagName === "TR") {
        trElement = e.target;
      } else if (e.target.tagName === "TD" && e.target.parentElement && e.target.parentElement.tagName === "TR") {
        trElement = e.target.parentElement;
      }

      if (trElement) { // NOTE: not extension-edit-item
        const extensionListTable = document.getElementById("fsbExtensionList");
        if (extensionListTable.classList.contains("edit-mode")) {
          this.debug("-- In Edit Mode -- Extensions Selection is Disabled");
          return;
        }

        if (trElement.classList.contains("extension-special")) {
          this.debug("-- Extension is SPECIAL -- Editing is Disabled");
          return;
        }
        if (trElement.classList.contains("extension-locked")) {
          this.debug("-- Extension is LOCKED -- Editing is Disabled");
          return;
        }

        this.debug("-- Got TR");

        if (trElement.classList.contains("extension-list-item")) { // NOTE: not extension-edit-item
          const extensionId = trElement.getAttribute("extensionId");
          this.debug(`-- Got TR.extension-list-item extensionId=${extensionId}`);

          if (extensionId) {
            await this.#editExtension(e, extensionId);
          }
        }
      }
    }
  }



  async #editExtension(e, extensionId) {
    if (! extensionId) return;

    this.debug(`-- extensionId="${extensionId}"`);
    const extProps = await this.#fsbOptionsApi.getExtensionPropsById(extensionId);

    if (! extProps) {
      this.error(`-- DID NOT GET EXTENSION PROPERTIES -- extensionId="${extensionId}"`);
    } else if (extProps.special) {
      this.error(`-- CANNOT EDIT EXTENSION because it is SPECIAL -- extensionId="${extensionId}"`);
    } else if (extProps.locked) {
      this.error(`-- CANNOT EDIT EXTENSION because it is LOCKED -- extensionId="${extensionId}"`);
    } else {
      // MABXXX WHY NOT JUST PASS IN extProps ???
      await this.#enterEditMode(false, true, extProps);
    }
  }

  async #addNewExtension(e) {
    this.debug("--");
    await this.#enterEditMode(true, false, undefined);
  }

  async #enterEditMode(addMode, editMode, extProps) {
    const extensionId   = extProps ? (                extProps.id          ) : '';
    const extensionName = extProps ? (                extProps.name        ) : '';
    const allowAccess   = extProps ? (                extProps.allowAccess ) : false;
    const readOnly      = extProps ? ( allowAccess && extProps.readOnly    ) : false;
    const noQuota       = extProps ? (                extProps.noQuota     ) : false;
    const locked        =                                                      false; // we couldn't be editing if it's locked, so it MUST be unlocked
    const dirProtect    = extProps ? (                extProps.dirProtect  ) : false;

    if (this.#DEBUG) this.debugAlways( "\n-- Enter Edit Mode --",
                                       `\n- addMode ......... ${addMode}`,
                                       `\n- editMode ........ ${editMode}`,
                                       `\n- extensionId ..... "${extensionId}"`,
                                       `\n- extensionName ... "${extensionName}"`,
                                       `\n- allowAccess ..... ${allowAccess}`,
                                       `\n- readOnly ........ ${readOnly}`,
                                       `\n- noQuota ......... ${noQuota}`,
                                       `\n- locked .......... ${readOnly}`,
                                       `\n- dirProtect ...... ${dirProtect}`,
                                     );

    if (! (addMode || editMode)) {
      this.error("-- #enterEditMode called with NEITHER addMode NOR editMode");
      return;
    }
    if (addMode && editMode) {
      this.error("-- #enterEditMode called with BOTH addMode AND editMode");
      return;
    }
    if (this.#editorModeEdit) {
      this.error("-- #enterEditMode called when already in editModeEdit");
      return;
    }
    if (this.#editorModeAdd) {
      this.error("-- #enterEditMode called when already in editModeAdd");
      return;
    }
    if (addMode && extProps) {
      this.error("-- #enterEditMode addMode with extProps");
      return;
    }
    if (editMode && ! extProps) {
      this.error("-- #enterEditMode editMode with NO extProps");
      return;
    }

    this.#editorModeAdd         = addMode;
    this.#editorModeEdit        = editMode;
    this.#editorEditExtensionId = extProps ? extProps.id : undefined;

    const extensionListTable        = document.getElementById("fsbExtensionList");
    const extensionEditTitleTR      = document.getElementById("extension_edit_title");
    const extensionEditTitleLabel   = document.getElementById("extension_edit_title_text");
    const extensionEditTR           = document.getElementById("extension_edit");

    const editAllowAccessCheck      = document.getElementById("extension_edit_check_allow_access");
////const editAllowAccessCheckLabel = editAllowAccessCheck?.nextElementSibling;
    const editReadOnlyCheck         = document.getElementById("extension_edit_check_read_only");
    const editReadOnlyCheckLabel    = editReadOnlyCheck?.nextElementSibling;
    const editExtensionIdText       = document.getElementById("extension_edit_text_id");
    const editExtensionNameText     = document.getElementById("extension_edit_text_name");
    const editNoQuotaCheck          = document.getElementById("extension_edit_check_no_quota");
    const editNoQuotaCheckLabel     = editNoQuotaCheck?.nextElementSibling;
    const editLockCheck             = document.getElementById("extension_edit_check_lock");
    const editLockCheckLabel        = editLockCheck?.nextElementSibling;
    const editDirProtectCheck       = document.getElementById("extension_edit_check_dir_protect");
    const editDirProtectCheckLabel  = editDirProtectCheck?.nextElementSibling;
    const editCancelButton          = document.getElementById("extension_edit_cancel");
    const editSaveButton            = document.getElementById("extension_edit_save");

    const extensionEditErrorTR      = document.getElementById("extension_edit_error");
    const editNameErrorLabel        = document.getElementById("extension_edit_error_name");
    const editIdErrorLabel          = document.getElementById("extension_edit_error_id");

    extensionListTable.classList.add("edit-mode");



    // SHOW the Editor Title Row - turn OFF display: none
    if (addMode) {
      extensionEditTitleLabel.textContent = this.#extensionListEditorTitleAddMode;
      editCancelButton.setAttribute( 'title', this.#tooltip_button_edit_cancel_addMode );
      editSaveButton.setAttribute(   'title', this.#tooltip_button_edit_save_addMode   );
    } else if (editMode) {
      extensionEditTitleLabel.textContent = this.#extensionListEditorTitleEditMode;
      editCancelButton.setAttribute( 'title', this.#tooltip_button_edit_cancel_editMode);
      editSaveButton.setAttribute(   'title', this.#tooltip_button_edit_save_editMode  );
    } else { // cannot happen
      extensionEditTitleLabel.textContent = '???';
    }
    extensionEditTitleTR.classList.remove('display-none'); // SHOW the Editor Title Row - turn OFF display: none



    // Configure & SHOW the Editor Fields Row - turn OFF display: none
    editExtensionIdText.value    = extensionId;
    editExtensionNameText.value  = extensionName;
    extensionEditTR.classList.remove('display-none');

    if (allowAccess) {
      editAllowAccessCheck.checked = true;
      editReadOnlyCheck.disabled   = false;
      if (readOnly) {
        editReadOnlyCheck.checked  = true;
        editReadOnlyCheck.setAttribute(      "title", this.#tooltip_checkbox_readOnly_enabled_checked );
        editReadOnlyCheckLabel.setAttribute( "title", this.#tooltip_checkbox_readOnly_enabled_checked );
      } else {
        editReadOnlyCheck.checked  = false;
        editReadOnlyCheck.setAttribute(      "title", this.#tooltip_checkbox_readOnly_enabled_unchecked );
        editReadOnlyCheckLabel.setAttribute( "title", this.#tooltip_checkbox_readOnly_enabled_unchecked );
      }
    } else {
      editAllowAccessCheck.checked = false;
      editReadOnlyCheck.disabled   = true;
      editReadOnlyCheck.checked    = false;
      editReadOnlyCheck.setAttribute(      "title", this.#tooltip_checkbox_readOnly_disabled_accessDisallowed );
      editReadOnlyCheckLabel.setAttribute( "title", this.#tooltip_checkbox_readOnly_disabled_accessDisallowed );
    }

    if (noQuota) {
      editNoQuotaCheck.checked = true;
      editNoQuotaCheck.setAttribute(      "title", this.#tooltip_checkbox_noQuota_enabled_checked );
      editNoQuotaCheckLabel.setAttribute( "title", this.#tooltip_checkbox_noQuota_enabled_checked );
    } else {
      editNoQuotaCheck.checked = false;
      editNoQuotaCheck.setAttribute(      "title", this.#tooltip_checkbox_noQuota_enabled_unchecked );
      editNoQuotaCheckLabel.setAttribute( "title", this.#tooltip_checkbox_noQuota_enabled_unchecked );
    }

    if (dirProtect) {
      editDirProtectCheck.checked = true;
      editDirProtectCheck.setAttribute(      "title", this.#tooltip_checkbox_dirProtect_enabled_checked );
      editDirProtectCheckLabel.setAttribute( "title", this.#tooltip_checkbox_dirProtect_enabled_checked );
    } else {
      editDirProtectCheck.checked = false;
      editDirProtectCheck.setAttribute(      "title", this.#tooltip_checkbox_dirProtect_enabled_unchecked );
      editDirProtectCheckLabel.setAttribute( "title", this.#tooltip_checkbox_dirProtect_enabled_unchecked );
    }

    if (locked) {
      editLockCheck.checked = true;
      editLockCheck.setAttribute(      "title", this.#tooltip_checkbox_lock_enabled_checked );
      editLockCheckLabel.setAttribute( "title", this.#tooltip_checkbox_lock_enabled_checked );
    } else {
      editLockCheck.checked = false;
      editLockCheck.setAttribute(      "title", this.#tooltip_checkbox_lock_enabled_unchecked );
      editLockCheckLabel.setAttribute( "title", this.#tooltip_checkbox_lock_enabled_unchecked );
    }



    // HIDE the Editor Fields ERROR Row - turn ON display: none
    extensionEditErrorTR.classList.add('display-none');
    editNameErrorLabel.textContent = '';
    editIdErrorLabel.textContent   = '';



    // DISABLE EVERYTHING ELSE IN THE EXTENSION ACCESS CONTROLS UI

    var selector;
    var element;

    selector = "button.add-extension"; // extension-head-item > extension-head-controls-right > extension-edit-controls > add-extension
    element = extensionListTable.querySelector(selector);
    if (! element) {
      this.error(`-- Failed to select ADD Extension Button, selector="${selector}"`);
    } else {
      element.disabled = true;
    }

    // DISABLE ALL THE CHECKBOXES and EDIT & DELETE BUTTONS DURING EDIT
    const domExtensionTRs = extensionListTable.querySelectorAll("tr.extension-list-item");
    this.debug(`-- domExtensionTRs.length=${domExtensionTRs.length}`);

    for (const domExtensionTR of domExtensionTRs) {
      const extensionId = domExtensionTR.getAttribute("extensionId");

      this.debug(`-- Enabling controls for Extension: extensionId="${extensionId}"`);

      selector = `input[type='checkbox'].allow-access-check[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.error(`-- Failed to select ALLOW ACCESS Checkbox for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }

      selector = `button.edit-extension[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.error(`-- Failed to select EDIT Button for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }

      selector = `button.remove-extension[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.error(`-- Failed to select DELETE Button for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }

      selector = `input[type='checkbox'].no-quota-check[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.error(`-- Failed to select NO QUOTA Checkbox for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }

      selector = `input[type='checkbox'].lock-check[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.error(`-- Failed to select LOCK Checkbox for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }

      selector = `input[type='checkbox'].dir-protect-check[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.error(`-- Failed to select DIR PROTECT Checkbox for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }

      selector = `input[type='checkbox'].read-only-check[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.error(`-- Failed to select READ-ONLY Checkbox for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }
    }

    await this.#enableExtensionAccessControls(false);

    this.debug("-- end");
  }



  async #removeExtension(e, extensionId) {
    if (! extensionId) return;

    this.debug(`-- extensionId="${extensionId}"`);
    const selectorTR  = `tr.extension-list-item[extensionId='${extensionId}']`;
    const extensionTR = e.target.closest(selectorTR);

    if (! extensionTR) {
      this.error(`-- Failed to get Extension container for remove: selector="${selectorTR}"`);

    } else if (extensionTR.classList.contains("extension-special")) { // MABXXX Should probably use the extensionProps to verify, but IdmOoptions.removeExtension() does check
      this.error(`-- CANNOT REMOVE Extension because it is SPECIAL`);

    } else if (extensionTR.classList.contains("extension-locked")) { // MABXXX Should probably use the extensionProps to verify, but IdmOoptions.removeExtension() does check
      this.error(`-- CANNOT REMOVE Extension because it is LOCKED`);

    } else {
      const extensionName = extensionTR.getAttribute("extensionName");

      const dirProtect  = extensionTR.classList.contains("extension-dir-protect"); // MABXXX Should probably use the extensionProps to verify
      const deleteExtDirs = await this.#fsbOptionsApi.isEnabledOnRemoveExtensionDeleteDirectory();

      this.debug(`Removing Extension id="${extensionId}" name="${extensionName}" deleteExtDirs=${deleteExtDirs} dirProtect=${dirProtect}`);

      var   extensionStats;
      const statsResponse = await this.#fsbCommandsApi.extensionStats(extensionId);
      this.debug(`Stats Response for Extension "${extensionId}":\n`, statsResponse);

      if (! statsResponse) {
        this.debug(`Failed to get Response from call to extensionStats("${extensionId}")`);
      } else if (statsResponse.stats) {
        this.debug(`Stats for Extension "${extensionId}":\n`, statsResponse.stats);
        extensionStats = statsResponse.stats;
      } else if ((typeof statsResponse.exists) === 'boolean' && ! statsResponse.exists) {
        this.debug(`Directory for Extension "${extensionId}" does not exist`);
      } else if (statsResponse.error) {
        this.debug(`"Error" Response getting stats for Extension "${extensionId}": "${statsResponse.error}"`);
      } else if (statsResponse.invalid) {
        this.debug(`"Invalid" Response getting stats for Extension "${extensionId}": "${statsResponse.invalid}"`);
      } else {
        this.error(`UNEXPECTED RESPONSE GETTING STATS for Extension "${extensionId}":\n`, statsResponse);
      }

      const confirmed = await this.#showRemoveExtensionConfirmDialog(extensionId, extensionName, extensionStats, dirProtect, deleteExtDirs);

      if (! confirmed) {
        this.debug(`The user has chosen NOT to continue with the removal of Extension id="${extensionId}" name="${extensionName}`);
      } else {
        this.debug(`The user has chosen to CONTINUE with the removal of Extension id="${extensionId}" name="${extensionName}`);

        // returns the extProps for the Extension that was removed or 'undefined' if not
        const removedExtensionProps = await this.#fsbOptionsApi.removeExtension(extensionId);

        if (! removedExtensionProps) {
          this.error(`-- EXTENSION NOT REMOVED extensionId="${extensionId}"`);
          this.#setErrorFor("fsbExtensionOptionsTitle", "options_message_error_extensionDeleteFailed");

        } else {
          this.debug(`-- Extension Removed: extensionId="${extensionId}" removedExtensionProps:\n`, removedExtensionProps);

          if (deleteExtDirs) { // delete whether dirProtect or not - we asked in the confirmation dialog
            // this method is a shortcut to just calling fsbCommandsApi.processInternalCommand()
            // responds with { 'exists': false } if the directory does not exist
            const deleteResponse = this.#fsbCommandsApi.deleteExtensionDirectory(extensionId);
            // do we care about the response?
          }

          extensionTR.remove();
        }
      }
    }
  }



  async #showRemoveExtensionConfirmDialog(extId, extName, extStats, dirProtect, willDeleteDir) {
    const dirStats = extStats? extStats[extId] : undefined;

    if (this.#DEBUG) this.debugAlways( "\n--- parameters:",
                                       `\n- extId ........... "${extId}"`,
                                       `\n- extName ......... "${extName}"`,
                                       `\n- dirName ......... "${extStats ? extStats.dirName : '(no directory)'}"`,
                                       `\n- willDeleteDir ... ${willDeleteDir}`,
                                       "\n- extStats:\n", extStats,
                                       "\n- dirStats:\n", dirStats,
                                     );


    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 500;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "\n--- Got the Current (Main, mail:3pane) Window:",
                  `\n- mainWindow.top=${mainWindow.top}`,
                  `\n- mainWindow.left=${mainWindow.left}`,
                  `\n- mainWindow.height=${mainWindow.height}`,
                  `\n- mainWindow.width=${mainWindow.width}`,
                );
  //////popupTop  = mainWindow.top  + mainWindow. / 2;
      popupTop  = mainWindow.top  + Math.round( (mainWindow.height - popupHeight) / 2 );
  //////popupLeft = mainWindow.left + 100;
      popupLeft = mainWindow.left + Math.round( (mainWindow.width  - popupWidth)  / 2 );
      if (mainWindow.height - 200 > popupHeight) popupHeight - mainWindow.Height - 200;   // make it higher, but not shorter
  ////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.#fsbOptionsApi.getWindowBounds("RemoveExtensionConfirmDialog"); // MABXXX PERHAPS THIS SHOULD ALWAYS BE CENTERED??????

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "\n--- restoring previous window bounds:",
                  `\n- bounds.top=${bounds.top}`,
                  `\n- bounds.left=${bounds.left}`,
                  `\n- bounds.width=${bounds.width}`,
                  `\n- bounds.height=${bounds.height}`,
                );
  //    popupTop    = bounds.top;
      popupTop    = mainWindow ? mainWindow.top  + Math.round( (mainWindow.height - bounds.height) / 2 ) : bounds.top; // CENTER ON THE MAIN WINDOW!!!
  //    popupLeft   = bounds.left;
      popupLeft   = mainWindow ? mainWindow.left + Math.round( (mainWindow.width  - bounds.width)  / 2 )  : bounds.left; // CENTER ON THE MAIN WINDOW!!!
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }

    this.debug( "\n--- window bounds:",
                `\n- popupTop=${popupTop}`,
                `\n- popupLeft=${popupLeft}`,
                `\n- popupWidth=${popupWidth}`,
                `\n- popupHeight=${popupHeight}`,
              );



    // window.id does not exist.  how do we get our own window id???
    var   ourTabId;
    var   ourWindowId;
    const currentTab = await messenger.tabs.getCurrent();
    if (! currentTab) {
      this.debug("-- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`-- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
      ourTabId    = currentTab.id;
      ourWindowId = currentTab.windowId;
    }

    const title           = utils.getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_title");           // "Confirm Extension Removal
    const button1MsgId    = "fsbOptions_dialog_confirmRemoveExtension_button_continue.label";
    const button2MsgId    = "fsbOptions_dialog_confirmRemoveExtension_button_cancel.label";
    const messageContinue = utils.getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_continue"); // "Do you wish to continue?"

    var  confirmDialogUrl = messenger.runtime.getURL("../dialogs/confirm.html")
                             + `?windowName=${encodeURIComponent("RemoveExtensionConfirmDialog")}`
                             + `&title=${encodeURIComponent(title)}`
                             + `&tc=${encodeURIComponent('yellow')}`
                             + "&buttons_3=false"
                             + `&button1MsgId=${encodeURIComponent(button1MsgId)}`
                             + `&button2MsgId=${encodeURIComponent(button2MsgId)}`;

    var msgNum  = 0;
    var ulNum   = 0;
    var fmsgNum = 0;
    var message = '';

    message = utils.getI18nMsgSubst("fsbOptions_dialog_confirmRemoveExtension_message_extId_willBeRemoved", extId);
    confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
    confirmDialogUrl += `&mw${msgNum}=${encodeURIComponent('bolder')}`

    if (dirStats) {
      message = utils.getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_hasDirectory");
      confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
      confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
      if (dirStats.count_children === undefined || dirStats.count_children === 0) {
        message = utils.getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_directoryIsEmpty");
        confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
      } else if (dirStats.count_children === 1) {
        message = utils.getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_directoryHasOneItem");
        confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
      } else {
        message = utils.getI18nMsgSubst("fsbOptions_dialog_confirmRemoveExtension_message_directoryHasNNItems", dirStats.count_children);
        confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
      }
      if (willDeleteDir) {
        message = utils.getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_willDeleteDirectory");
        confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
        confirmDialogUrl += `&uw${ulNum}=${encodeURIComponent('bold')}`
        confirmDialogUrl += `&uc${ulNum}=${encodeURIComponent('red')}`
        if (dirProtect) {
          message = utils.getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_dirProtect");
          confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
          confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
          confirmDialogUrl += `&uw${ulNum}=${encodeURIComponent('bold')}`
          confirmDialogUrl += `&uc${ulNum}=${encodeURIComponent('red')}`
        } else {
        }
      } else {
        message = utils.getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_willNotDeleteDirectory");
        confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
      }
    } else {
      message = utils.getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_noDirectory");
      confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
      confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
    }

    confirmDialogUrl += `&f${++fmsgNum}=${encodeURIComponent(" ")}`;                // empty line

    confirmDialogUrl += `&f${++fmsgNum}=${encodeURIComponent(messageContinue)}`;
    confirmDialogUrl += `&fw${fmsgNum}=${encodeURIComponent('bold')}`;

    confirmDialogUrl += `&c=${encodeURIComponent(msgNum)}`;
    confirmDialogUrl += `&u=${encodeURIComponent(ulNum)}`;
    confirmDialogUrl += `&f=${encodeURIComponent(fmsgNum)}`;

    this.debug(`confirmDialogUrl="${confirmDialogUrl}"`);

    // MABXXX DAMN!!! THERE'S NO WAY TO MAKE THIS MODAL!!! MUST USE action "default_popup".  But how to get Extension ID, etc?
    // The window.confirm() function doesn't give a way to specify button text.
    // Which is worse? Ugly ugly UGLY!!!
    this.#confirmDialogWindow = await messenger.windows.create(
      {
        'url':                 confirmDialogUrl,
        'type':                "popup",
        'titlePreface':        utils.getI18nMsg("extensionName") + " - ",
        'top':                 popupTop,
        'left':                popupLeft,
        'height':              popupHeight,
        'width':               popupWidth,
        'allowScriptsToClose': true,
      }
    );

    this.debug( "\n--- Remove Extension Confirmation Popup Window Created --",
                `\n-from ourTabId="${ourTabId}"`,
                `\n-from ourWindowId="${ourWindowId}"`,
                `\n-confirmDialogWindow.id="${this.#confirmDialogWindow.id}"`,
                `\n-URL="${confirmDialogUrl}"`,
              );

    // Re-focus on the confirmDialog window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE #confirmRemoveExtensionDialogPrompt() ???
//  const focusListener = async (windowId) => this.#windowFocusChanged(windowId, ourTabId, ourWindowId, this.#confirmDialogWindow.id);
    const focusListener = null;
//  messenger.windows.onFocusChanged.addListener(focusListener);

    // ConfirmDialogResponse - expected:
    // - null     - the user closed the popup window        (set by our own windows.onRemoved listener - the defaultResponse sent to #confirmDialogPrompt)
    // - CLOSED   - the user closed the popup window        (sent by the ConfirmDialog window's window.onRemoved listener -- NOT REALLY - we use our own onRemoved listener)
    // - BUTTON_1 - the user clicked button 1               (sent by the ConfirmDialog window's button listener)
    // - BUTTON_2 - the user clicked button 2               (sent by the ConfirmDialog window's button listener)
    // - BUTTON_3 - the user clicked button 3               (sent by the ConfirmDialog window's button listener)

    const confirmDialogResponse = await this.#confirmRemoveExtensionDialogPrompt(this.#confirmDialogWindow.id, focusListener, null);
    this.debug(`-- confirmDialogResponse="${confirmDialogResponse}"`);

    switch (confirmDialogResponse) {
      case 'BUTTON_1': // 'Yes' button - Continue
        this.debug("-- ConfirmDialog 'Continue' clicked");
        return true;
      case 'BUTTON_2': // 'No' button - Cancel
        this.debug("-- ConfirmDialog 'Cancel' clicked");
        return false;
      case 'CLOSED':   // this never happens - see comments in ConfirmDialog regarding conduit failure
      case null:       // closed using the window close button
        this.debug("-- ConfirmDialog window closed");
        return false;
      default:
        this.error(`-- UNKNOWN ConfirmDialog Response - NOT A KNOWN RESPONSE: "${confirmDialogResponse}"`);
    }

    this.#confirmDialogWindow = undefined;
  }

  async #confirmRemoveExtensionDialogPrompt(confirmDialogWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(confirmDialogWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "-- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId === confirmDialogWindowId) {

//////////messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
////////////messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The ConfirmDialog sends a message as ConfirmDialogResponse:
       * - CLOSED   - the user closed the popup window   (sent by the ConfirmDialog window's window.onRemoved listener -- NOT REALLY -- using OUR onRemoved instead)
       * - BUTTON_1 - the user clicked button 1          (sent by the ConfirmDialog window's button listener)
       * - BUTTON_2 - the user clicked button 2          (sent by the ConfirmDialog window's button listener)
       * - BUTTON_3 - the user clicked button 3          (sent by the ConfirmDialog window's button listener)
       * Save this ConfirmDialogResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab && sender.tab.windowId === confirmDialogWindowId && request && request.hasOwnProperty("ConfirmDialogResponse")) {
          response = request.ConfirmDialogResponse;
        }

        return false; // we're not sending any response
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  async #selectAndAddInstalledExtensions(e) {
    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:",
                  `\n- mainWindow.top=${mainWindow.top}`,
                  `\n- mainWindow.left=${mainWindow.left}`,
                  `\n- mainWindow.height=${mainWindow.height}`,
                  `\n- mainWindow.width=${mainWindow.width}`,
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.#fsbOptionsApi.getWindowBounds("extensionChooserWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:",
                  `\n- bounds.top=${bounds.top}`,
                  `\n- bounds.left=${bounds.left}`,
                  `\n- bounds.width=${bounds.width}`,
                  `\n- bounds.height=${bounds.height}`,
                );
      popupTop    = bounds.top;
      popupLeft   = bounds.left;
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }



    // window.id does not exist.  how do we get our own window id???
    var   ourTabId;
    var   ourWindowId;
    const currentTab = await messenger.tabs.getCurrent();
    if (! currentTab) {
      this.debug("-- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`-- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
      ourTabId    = currentTab.id;
      ourWindowId = currentTab.windowId;
    }



    const extensionChooserUrl    = messenger.runtime.getURL("../extensionChooserUI/extensionChooserUI.html");
    this.#extensionChooserWindow = await messenger.windows.create(
      {
        url:                 extensionChooserUrl,
        type:                "popup",
        titlePreface:        utils.getI18nMsg("options_fsbExtensionChooserTitle", "Installed Extensions") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "-- Installed Extensions Chooser Popup Window Created --",
                `\n-from ourTabId="${ourTabId}"`,
                `\n-from ourWindowId="${ourWindowId}"`,
                `\n-extensionChooserWindow.id="${this.#extensionChooserWindow.id}"`,
////////////////`\n-URL="${extensionChooserUrl}"`,
              );

    // Re-focus on the extensionChooser window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE #extensionChooserPrompt() ???
    const focusListener = async (windowId) => this.#windowFocusChanged(windowId, ourTabId, ourWindowId, this.#extensionChooserWindow.id);
    messenger.windows.onFocusChanged.addListener(focusListener);

    // editorResponse - expected:
    // - null               - the user closed the popup window                 (set by our own windows.onRemoved listener - the defaultResponse sent to extensionChooserPrompt)
    // - CLOSED             - the user closed the popup window                 (sent by the ExtensionChooser window's window.onClosed listener)
    // - CANCELED           - the user clicked the Cancel button               (sent by the ExtensionChooser window's Cancel button listener)
    // - { 'ADDED': count } - Extensions added, count is how many (may be 0)   (sent by the ExtensionChooser window's Save button listener)

    const extensionChooserResponse = await this.#extensionChooserPrompt(this.#extensionChooserWindow.id, focusListener, null);
    this.debug(`-- ExtensionChooser extensionChooserResponse="${extensionChooserResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (extensionChooserResponse) {
      case 'CANCELED':
      case 'CLOSED':
      case null:
        this.#extensionChooserWindow = undefined;
        break;

      default:
        if (! typeof (extensionChooserResponse === 'object')) {
          this.error(`-- UNKNOWN ExtensionChooser Response - NOT A KEYWORD OR OBJECT: "${extensionChooserResponse}"`);

        } else {
          if (! extensionChooserResponse.hasOwnProperty('ADDED')) {
            this.error(`-- UNKNOWN ExtensionChooser Response - Object has No 'ADDED' Property: "${extensionChooserResponse}"`);

          } else {
            const added = extensionChooserResponse.ADDED;
            if (typeof added !== 'number') {
              this.error(`-- MALFORMED ExtensionChooser Response - Invalid 'ADDED' Property type - expected 'number', got: '${typeof added}'`);

            } else if (added === 0) {
              this.debug("-- No Extensions were added");

            } else {
              this.debug(`-- ${added}  Extensions were added`);
              await this.#refreshExtensionListUI(e);
            }
          }
        }

        this.#extensionChooserWindow = undefined;
    }
  }

  async #extensionChooserPrompt(extensionChooserWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(extensionChooserWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "-- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId === extensionChooserWindowId) {

//////////messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
          messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The ExtensionChooser sends a message as ExtensionChooserResponse:
       *  - CLOSED             - the user closed the popup window                  --  Problem - sometime message "conduit" gets destroyed before message is sent/received
       *  - CANCELED           - the user clicked the Cancel button
       *  - { 'ADDED': count } - Extensions added, count is how many (may be 0)    -- MABXXX NEED TO CHANGE { 'ADDED': 0 } to something else???
       * Save this ExtensionChooserResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab && sender.tab.windowId === extensionChooserWindowId && request && request.hasOwnProperty("ExtensionChooserResponse")) {
          response = request.ExtensionChooserResponse;
        }
        return false; // we're not sending any response
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  async #showBackupManager(e) {
    e.preventDefault();

    this.debug("-- begin");

    const showBackupManagerButton = document.getElementById("fsbShowBackupManagerButton");
    showBackupManagerButton.disabled = true;

    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:",
                  `\n- mainWindow.top=${mainWindow.top}`,
                  `\n- mainWindow.left=${mainWindow.left}`,
                  `\n- mainWindow.height=${mainWindow.height}`,
                  `\n- mainWindow.width=${mainWindow.width}`,
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.#fsbOptionsApi.getWindowBounds("backupManagerWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:",
                  `\n- bounds.top=${bounds.top}`,
                  `\n- bounds.left=${bounds.left}`,
                  `\n- bounds.width=${bounds.width}`,
                  `\n- bounds.height=${bounds.height}`,
                );
      popupTop    = bounds.top;
      popupLeft   = bounds.left;
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }



    // window.id does not exist.  how do we get our own window id???
    var   ourTabId;
    var   ourWindowId;
    const currentTab = await messenger.tabs.getCurrent();
    if (! currentTab) {
      this.debug("-- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`-- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
      ourTabId    = currentTab.id;
      ourWindowId = currentTab.windowId;
    }



    const backupManagerUrl    = messenger.runtime.getURL("../backupManager/backupManager.html");
    this.#backupManagerWindow = await messenger.windows.create(
      {
        url:                 backupManagerUrl,
        type:                "popup",
        titlePreface:        utils.getI18nMsg("options_fsbOptionsTitle") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "-- Installed Backup Manager Popup Window Created --",
                `\n-from ourTabId="${ourTabId}"`,
                `\n-from ourWindowId="${ourWindowId}"`,
                `\n-backupManagerWindow.id="${this.#backupManagerWindow.id}"`,
////////////////`\n-URL="${backupManagerUrl}"`,
              );

    // Re-focus on the backupManager window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE #backupManagerPrompt() ???
    const focusListener = async (windowId) => this.#windowFocusChanged(windowId, ourTabId, ourWindowId, this.#backupManagerWindow.id);
    messenger.windows.onFocusChanged.addListener(focusListener);

    // BackupManagerResponse - expected:
    // - null                     - the user closed the popup window               (set by our own windows.onRemoved listener - the defaultResponse sent to backupManagerPrompt)
    // - CLOSED                   - the user closed the popup window               (sent by the BackupManager window's window.onClosed listener)
    // - DONE                     - the user clicked the Done button               (sent by the BackupManager window's Done button listener)
    // - { 'RESTORED': fileName } - Options restored from file with given fileName (sent by the BackupManager window's Restore button listener)

    const backupManagerResponse = await this.#backupManagerPrompt(this.#backupManagerWindow.id, focusListener, null);
    this.debug(`-- BackupManager backupManagerResponse="${backupManagerResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (backupManagerResponse) {
      case 'DONE':
      case 'CLOSED':
      case null:
        this.#backupManagerWindow        = undefined;
        showBackupManagerButton.disabled = false;
        break;

      default:
        if (! typeof (backupManagerResponse === 'object')) {
          this.error(`-- UNKNOWN BackupManager Response - NOT A KEYWORD OR OBJECT: "${backupManagerResponse}"`);

        } else {
          if (! Object.hasOwn(backupManagerResponse, 'RESTORED')) {
            this.error(`-- UNKNOWN BackupManager Response - Object has No 'RESTORED' Property: "${backupManagerResponse}"`);

          } else {
            const fileName = backupManagerResponse.RESTORED;
            if (typeof fileName !== 'string') {
              this.error(`-- MALFORMED BackupManager Response - Invalid 'RESTORED' Property type - expected string, got: "${typeof fileName}"`);

            } else if (fileName.length < 1) {
              this.error(`-- MALFORMED BackupManager Response - Invalid 'RESTORED' Property fileName.length=${fileName.length}`);

            } else {
              // MABXXX BackupManager currently CLOSES ITSELF

              this.debug(`-- Options Restored from file "${fileName}"`);

//            if (this.#backupManagerWindow) {
//              try {
//                messenger.windows.remove(this.#backupManagerWindow.id);
//                this.#backupManagerWindow = undefined;
//              } catch (error) {}
//            }

              if (this.#eventLogManagerWindow) {
                try {
                  messenger.windows.remove(this.#eventLogManagerWindow.id);
                  this.#eventLogManagerWindow = undefined;
                } catch (error) {}
              }

              if (this.#storageManagerWindow) {
                try {
                  messenger.windows.remove(this.#storageManagerWindow.id);
                  this.#storageManagerWindow = undefined;
                } catch (error) {}
              }

              if (this.#extensionChooserWindow) {
                try {
                  messenger.windows.remove(this.#extensionChooserWindow.id);
                  this.#extensionChooserWindow = undefined;
                } catch (error) {}
              }

              if (this.#confirmDialogWindow) {
                try {
                  messenger.windows.remove(this.#confirmDialogWindow.id);
                  this.#confirmDialogWindow = undefined;
                } catch (error) {}
              }

              // MABXXX BackupManager currently CLOSES ITSELF
              // If Backup Manager no longer closes itself, need to remove this
              this.#backupManagerWindow        = undefined;
              showBackupManagerButton.disabled = false;

              await this.#buildUI();
            }
          }
        }
    }
  }

  async #backupManagerPrompt(backupManagerWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(backupManagerWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "-- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId === backupManagerWindowId) {

//////////messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
          messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The BackupManager sends a message as BackupManagerResponse:
       *  - CLOSED                   - the user closed the popup window               (sent by the BackupManager window's window.onClosed listener)
       *  - DONE                     - the user clicked the Done button               (sent by the BackupManager window's Done button listener)
       *  - { 'RESTORED': fileName } - Options restored from file with given fileName (sent by the BackupManager window's Restore button listener)
       * Save this BackupManagerResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab && sender.tab.windowId === backupManagerWindowId && request && request.hasOwnProperty("BackupManagerResponse")) {
          response = request.BackupManagerResponse;
        }
        return false; // we're not sending any response
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  async #showEventLogManager(e) {
    e.preventDefault();

    this.debug("-- begin");

    const showEventLogManagerButton = document.getElementById("fsbShowEventLogManagerButton");
    showEventLogManagerButton.disabled = true;

    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:",
                  `\n- mainWindow.top=${mainWindow.top}`,
                  `\n- mainWindow.left=${mainWindow.left}`,
                  `\n- mainWindow.height=${mainWindow.height}`,
                  `\n- mainWindow.width=${mainWindow.width}`,
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.#fsbOptionsApi.getWindowBounds("eventLogManagerWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:",
                  `\n- bounds.top=${bounds.top}`,
                  `\n- bounds.left=${bounds.left}`,
                  `\n- bounds.width=${bounds.width}`,
                  `\n- bounds.height=${bounds.height}`,
                );
      popupTop    = bounds.top;
      popupLeft   = bounds.left;
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }



    // window.id does not exist.  how do we get our own window id???
    var   ourTabId;
    var   ourWindowId;
    const currentTab = await messenger.tabs.getCurrent();
    if (! currentTab) {
      this.debug("-- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`-- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
      ourTabId    = currentTab.id;
      ourWindowId = currentTab.windowId;
    }



    const eventLogManagerUrl    = messenger.runtime.getURL("../eventLogManager/eventLogManager.html");
    this.#eventLogManagerWindow = await messenger.windows.create(
      {
        url:                 eventLogManagerUrl,
        type:                "popup",
        titlePreface:        utils.getI18nMsg("options_fsbOptionsTitle") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "-- Installed Backup Manager Popup Window Created --",
                `\n-from ourTabId="${ourTabId}"`,
                `\n-from ourWindowId="${ourWindowId}"`,
                `\n-eventLogManagerWindow.id="${this.#eventLogManagerWindow.id}"`,
////////////////`\n-URL="${eventLogManagerUrl}"`,
              );

    // Re-focus on the eventLogManager window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE #eventLogManagerPrompt() ???
    const focusListener = async (windowId) => this.#windowFocusChanged(windowId, ourTabId, ourWindowId, this.#eventLogManagerWindow.id);
    messenger.windows.onFocusChanged.addListener(focusListener);

    // EventLogManagerResponse - expected:
    // - null                     - the user closed the popup window               (set by our own windows.onRemoved listener - the defaultResponse sent to eventLogManagerPrompt)
    // - CLOSED                   - the user closed the popup window               (sent by the EventLogManager window's window.onClosed listener)
    // - DONE                     - the user clicked the Done button               (sent by the EventLogManager window's Done button listener)

    const eventLogManagerResponse = await this.#eventLogManagerPrompt(this.#eventLogManagerWindow.id, focusListener, null);
    this.debug(`-- EventLogManager eventLogManagerResponse="${eventLogManagerResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (eventLogManagerResponse) {
      case 'DONE':
      case 'CLOSED':
      case null:
        this.#eventLogManagerWindow        = undefined;
        showEventLogManagerButton.disabled = false;
        break;
      default:
////////this.#eventLogManagerWindow = undefined; // MABXXX DO IT ANYWAY???
    }
  }

  async #eventLogManagerPrompt(eventLogManagerWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(eventLogManagerWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "-- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId === eventLogManagerWindowId) {

//////////messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
          messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The EventLogManager sends a message as EventLogManagerResponse:
       *  - CLOSED                   - the user closed the popup window               (sent by the EventLogManager window's window.onClosed listener)
       *  - DONE                     - the user clicked the Done button               (sent by the EventLogManager window's Done button listener)
       * Save this EventLogManagerResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab && sender.tab.windowId === eventLogManagerWindowId && request && request.hasOwnProperty("EventLogManagerResponse")) {
          response = request.EventLogManagerResponse;
        }
        return false; // we're not sending any response
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  async #showStorageManager(e) {
    e.preventDefault();

    this.debug("-- begin");

    const showStorageManagerButton = document.getElementById("fsbShowStorageManagerButton");
    showStorageManagerButton.disabled = true;

    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:",
                  `\n- mainWindow.top=${mainWindow.top}`,
                  `\n- mainWindow.left=${mainWindow.left}`,
                  `\n- mainWindow.height=${mainWindow.height}`,
                  `\n- mainWindow.width=${mainWindow.width}`,
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.#fsbOptionsApi.getWindowBounds("storageManagerWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:",
                  `\n- bounds.top=${bounds.top}`,
                  `\n- bounds.left=${bounds.left}`,
                  `\n- bounds.width=${bounds.width}`,
                  `\n- bounds.height=${bounds.height}`,
                );
      popupTop    = bounds.top;
      popupLeft   = bounds.left;
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }



    // window.id does not exist.  how do we get our own window id???
    var   ourTabId;
    var   ourWindowId;
    const currentTab = await messenger.tabs.getCurrent();
    if (! currentTab) {
      this.debug("-- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`-- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
      ourTabId    = currentTab.id;
      ourWindowId = currentTab.windowId;
    }



    const storageManagerUrl    = messenger.runtime.getURL("../storageManager/storageManager.html");
    this.#storageManagerWindow = await messenger.windows.create(
      {
        url:                 storageManagerUrl,
        type:                "popup",
        titlePreface:        utils.getI18nMsg("options_fsbOptionsTitle") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "-- Stats Manager Popup Window Created --",
                `\n-from ourTabId="${ourTabId}"`,
                `\n-from ourWindowId="${ourWindowId}"`,
                `\n-storageManagerWindow.id="${this.#storageManagerWindow.id}"`,
////////////////`\n-URL="${storageManagerUrl}"`,
              );

    // Re-focus on the storageManager window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE #storageManagerPrompt() ???
    const focusListener = async (windowId) => this.#windowFocusChanged(windowId, ourTabId, ourWindowId, this.#storageManagerWindow.id);
    messenger.windows.onFocusChanged.addListener(focusListener);

    // StorageManagerResponse - expected:
    // - null                     - the user closed the popup window               (set by our own windows.onRemoved listener - the defaultResponse sent to storageManagerPrompt)
    // - CLOSED                   - the user closed the popup window               (sent by the StorageManager window's window.onClosed listener)
    // - DONE                     - the user clicked the Done button               (sent by the StorageManager window's Done button listener)

    const storageManagerResponse = await this.#storageManagerPrompt(this.#storageManagerWindow.id, focusListener, null);
    this.debug(`-- StorageManager storageManagerResponse="${storageManagerResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (storageManagerResponse) {
      case 'DONE':
      case 'CLOSED':
      case null:
        this.#storageManagerWindow        = undefined;
        showStorageManagerButton.disabled = false;
        break;
      default:
////////this.#storageManagerWindow = undefined; // MABXXX DO THIS ANYWAY???
    }
  }

  async #storageManagerPrompt(storageManagerWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(storageManagerWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "-- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId === storageManagerWindowId) {

//////////messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
          messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The StorageManager sends a message as StorageManagerResponse:
       *  - CLOSED                   - the user closed the popup window               (sent by the StorageManager window's window.onClosed listener)
       *  - DONE                     - the user clicked the Done button               (sent by the StorageManager window's Done button listener)
       * Save this StorageManagerResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab && sender.tab.windowId === storageManagerWindowId && request && request.hasOwnProperty("StorageManagerResponse")) {
          response = request.StorageManagerResponse;
        }
        return false; // we're not sending any response
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  async #windowFocusChanged(windowId, creatorTabId, creatorWindowId, extensionChooserWindowId) {
    if (true) return; // this whole thing is messed up

    const lastFocusedWindow = await messenger.windows.getLastFocused();
    var   lastFocusedWindowId;
    if (lastFocusedWindow) lastFocusedWindowId = lastFocusedWindow.id;

    this.debug( "--",
                "\n- windowId="                  + windowId,
                "\n- this.#prevFocusedWindowId=" + this.#prevFocusedWindowId,
                "\n- lastFocusedWindowId="       + lastFocusedWindowId,
                "\n- creatorTabId="              + creatorTabId,
                "\n- creatorWindowId="           + creatorWindowId,
                "\n- extensionChooserWindowId="  + extensionChooserWindowId,
              );

    if ( windowId
         && windowId                 !== messenger.windows.WINDOW_ID_NONE
         && windowId                 !== extensionChooserWindowId
         && windowId                 === creatorWindowId
/////////&& creatorWindowId          !== lastFocusedWindowId
         && extensionChooserWindowId
/////////&& extensionChooserWindowId !== lastFocusedWindowId
         && extensionChooserWindowId !== this.#prevFocusedWindowId
       )
    {
      this.debug( "-- Creator Window got focus, bring Extension Chooser Window into focus above it --",
                  "\n- creatorTabId="             + creatorTabId,
                  "\n- creatorWindowId="          + creatorWindowId,
                  "\n- extensionChooserWindowId=" + extensionChooserWindowId,
                );
      try {
        messenger.windows.update(extensionChooserWindowId, { focused: true });
      } catch (error) {
        this.caught(error, "-- PERHAPS WINDOW CLOSED???");
      }
    }

    if (windowId !== messenger.windows.WINDOW_ID_NONE) this.#prevFocusedWindowId = windowId;
  }



  async #addAllInstalledExtensions(e) { // MABXXX NOT USED ANYMORE
    this.debug("-- begin");

    const installedExtensions = await messenger.management.getAll();
    const allExtensionsProps  = await this.#fsbOptionsApi.getExtensionsProps();

    this.debug(`-- installedExtensions.length=${installedExtensions.length} allExtensionsProps.length=${Object.keys(allExtensionsProps).length}`);

    const addedExtensionsProps = {};
    var   count           = 0;
    if (installedExtensions) {
      for (const ext of installedExtensions) {
        this.debug( "-- INSTALLED EXTENSION:",
                    `\n- ext.id          = "${ext.id}"`,
                    `\n -ext.shortName   = "${ext.shortName}"`,
                    `\n -ext.name        = "${ext.name}"`
                    `\n -ext.enabled     = ${ext.enabled}`,
                    `\n -ext.type        = "${ext.type}"`,
                    `\n -ext.description = "${ext.description}"`,
                  );
        if (ext.type !== 'extension') {
          this.debug(`-- SKIPPING: Installed Extension is not Type 'extension' -- ext.type="${ext.type}"`);

        } else if (allExtensionsProps.hasOwnProperty(ext.id)) {
            this.debug(`-- SKIPPING: Installed Extension is ALREADY in the list -- ext.id="${ext.id}"`);

        } else {
          this.debug(`-- ADDING Installed Extension -- ext.id="${ext.id}" ext.name="${ext.name}"`);

          const extProps = {
            'id':          ext.id,
            'name':        ext.name,
            'allowAccess': false,
            'readOnly':    false,
            'locked':      false,
            'dirProtect':  false,
            'noQuota':     false,
          };

          addedExtensionsProps[ext.id] = extProps;
          allExtensionsProps[ext.id]   = extProps;
          count++;
        }
      }

      if (count) await this.#fsbOptionsApi.storeExtensionsProps(allExtensionsProps);
    }

    const addedExtensionsPropsLength = Object.keys(addedExtensionsProps).length;

    if (addedExtensionsPropsLength > 0) {
      this.debug(`-- addedExtensionsPropsLength ${addedExtensionsPropsLength} > 0 -- calling #refreshExtensionListUI()`);
      await this.#refreshExtensionListUI(e);
    }

    this.debug(`-- end -- Added Extensions: addedExtensionsPropsLength=${addedExtensionsPropsLength} - count=${count}`);
    return addedExtensionsProps;
  }



  async #allowAccessAllExtensions(e) {
    this.debug("-- begin");

    const count = await this.#fsbOptionsApi.allowAccessAllExtensions();

    const domAllowAccessChecks = document.querySelectorAll("input[type='checkbox'].allow-access-check");
    this.debug(`-- domAllowAccessChecks.length=${domAllowAccessChecks.length}`);
    for (const check of domAllowAccessChecks) {
      const extensionId = check.getAttribute("extensionId");

      this.debug(`-- extensionId="${extensionId}" setting check=true`);
      check.checked = true;

      const selectorTR      = `tr.extension-list-item[extensionId='${extensionId}']`;
      const extensionItemTR = check.closest(selectorTR);
      if (! extensionItemTR) {
        this.debug(`-- FAILED TO SELECT ANCESTOR TR "${selectorTR}"`);

      } else if (extensionItemTR.classList.contains("extension-locked")) {
        this.debug(`-- Extension is LOCKED`);

      } else {
        this.debug(`-- removing class "access-disallowed"`);
        extensionItemTR.classList.remove("access-disallowed");
      }
    }

    this.debug("-- end");
  }



  async #disallowAccessAllExtensions(e) {
    this.debug("-- begin");

    const count = await this.#fsbOptionsApi.disallowAccessAllExtensions();

    const domAllowAccessChecks = document.querySelectorAll("input[type='checkbox'].allow-access-check");
    this.debug(`-- domAllowAccessChecks.length=${domAllowAccessChecks.length}`);

    for (const check of domAllowAccessChecks) {
      // MABXXX should we check if it's DISABLED???

      const extensionId = check.getAttribute("extensionId");

      if (! extensionId) {
        this.error(`-- allow-access-check checkbox has no extensionId Attribute`);
      } else {
        const selectorTR      = `tr.extension-list-item[extensionId='${extensionId}']`;
        const extensionItemTR = check.closest(selectorTR);

        if (! extensionItemTR) {
          this.error(`-- FAILED TO SELECT ANCESTOR TR: "${selectorTR}"`);
        } else if (extensionItemTR.classList.contains("extension-locked")) {
          this.debug(`-- Extension is LOCKED`);
        } else {
          this.debug(`-- extensionId="${extensionId}" setting check=false`);
          check.checked = false;
          this.debug(`-- adding class "access-disallowed"`);
          extensionItemTR.classList.add("access-disallowed");
        }
      }
    }

    this.debug("-- end");
  }



  async #allowAccessSelectedExtensions(e) {
    this.debug("-- begin");

    const selectedExtensionIds = this.#getSelectedExtensionIds();
    this.debug(`-- selectedExtensionIds.length=${selectedExtensionIds.length}`);

    const count = await this.#fsbOptionsApi.allowAccessSelectedExtensions(selectedExtensionIds);

    for (const extensionId of selectedExtensionIds) {
      this.debug(`-- extensionId="${extensionId}" setting check=true`);
      const checkSelector = `input.allow-access-check[type='checkbox'][extensionId='${extensionId}']`;
      const check         = document.querySelector(checkSelector);

      if (! check) {
        this.debug(`-- FAILED TO SELECT CHECK "${checkSelector}"`);

      } else {
        check.checked = true;

        const selectorTR      = `tr.extension-list-item[extensionId='${extensionId}']`;
        const extensionItemTR = check.closest(selectorTR);
        if (! extensionItemTR) {
          this.debug(`-- FAILED TO SELECT ANCESTOR TR "${selectorTR}"`);

        } else if (extensionItemTR.classList.contains("extension-locked")) {
          this.debug(`-- Extension is LOCKED`);

        } else {
          this.debug(`-- Removing class "access-disallowed"`);
          extensionItemTR.classList.remove("access-disallowed");
        }
      }
    }

    this.debug("-- end");
  }



  async #disallowAccessSelectedExtensions(e) {
    this.debug("-- begin");

    const selectedExtensionIds = this.#getSelectedExtensionIds();
    this.debug(`-- selectedExtensionIds.length=${selectedExtensionIds.length}`);

    const count = await this.#fsbOptionsApi.disallowAccessSelectedExtensions(selectedExtensionIds);

    for (const extensionId of selectedExtensionIds) {
      this.debug(`-- extensionId="${extensionId}" setting check=false`);
      const checkSelector = `input.allow-access-check[type='checkbox'][extensionId='${extensionId}']`;
      const check         = document.querySelector(checkSelector);

      if (! check) {
        this.debug(`-- FAILED TO SELECT CHECK "${checkSelector}"`);

      } else {
        check.checked = false;

        const selectorTR      = `tr.extension-list-item[extensionId='${extensionId}']`;
        const extensionItemTR = check.closest(selectorTR);
        if (! extensionItemTR) {
          this.debug(`-- FAILED TO SELECT ANCESTOR TR "${selectorTR}"`);

        } else if (extensionItemTR.classList.contains("extension-locked")) {
          this.debug(`-- Extension is LOCKED`);

        } else {
          this.debug(`-- Adding class "access-disallowed"`);
          extensionItemTR.classList.add("access-disallowed");
        }
      }
    }

    this.debug("-- end");
  }



  // MABXXX IS THIS EVEN USED ANYMORE??? The button to remove selected extension -- more than one extension at a time -- has been removed
  async #removeSelectedExtensions(e) {
    this.debug("-- begin");

    const selectedExtensionIds = this.#getSelectedExtensionIds();

    this.debug(`-- selectedExtensionIds.length=${selectedExtensionIds.length}`);

    const extensionIdsToRemove  = [];
    const extensionDirsToDelete = [];
    for (const selectedExtId of selectedExtensionIds) {
      this.debug(`-- extensionId="${selectedExtId}"`);
      const selectorTR      = `tr.extension-list-item[extensionId='${selectedExtId}']`;
      const extensionItemTR = document.querySelector(selectorTR);

      if (! extensionItemTR) {
        this.debug(`-- FAILED TO SELECT TR "${selectorTR}"`);
      } else if (extensionItemTR.classList.contains("extension-special")) {
        this.debug(`-- Extension is SPECIAL`);
      } else if (extensionItemTR.classList.contains("extension-locked")) {
        this.debug(`-- Extension is LOCKED`);
      } else {
        if (extensionItemTR.classList.contains("extension-dir-protect")) {
          this.debug(`-- Extension's Directory is PROTECTED`);
        } else {
          extensionDirsToDelete.push(selectedExtId);
        }
        extensionIdsToRemove.push(selectedExtId);
        extensionItemTR.remove();
      }
    }

    this.debug(`-- extensionIdsToRemove.length=${extensionIdsToRemove.length}`);

    const deletedExtensionProps = await this.#fsbOptionsApi.removeExtensions(extensionIdsToRemove, false); // ignoreLocks=false: do not delete locked extensions

    this.debug(`-- deleted from identityProps: ${deletedExtensionProps.length}`);

    const deleteExtensionDirectories = await this.#fsbOptionsApi.isEnabledOnRemoveExtensionDeleteDirectory();
    if (deleteExtensionDirectories) {
      for (const extId of extensionDirsToDelete) {
        this.debug(`-- deleting extension directory, extensionId="${extId}"`);
        const result = await this.#fsbCommandsApi.deleteExtensionDirectory(extId) // this method is a shortcut to just calling fsbCommandsApi.processInternalCommand();
        // do we care about the result?
      }
    }

    this.debug("-- end");
  }



  async #doneButtonClicked(e) {
    this.debug("-- begin");

    e.preventDefault();

    if (! this.#windowMode) {
      this.error("DONE Button Clicked but NOT in Window Mode");

    } else {
      this.debug(`DONE Button Clicked, windowRequestedBy=${this.#windowModeRequestedBy}"`);

      // Send a message ONLY if we were requested by ourself, not when requested at extension start, etc
      if (this.#windowModeRequestedBy !== this.#CLASS_NAME) {
        this.debug(`DONE Button Clicked but windowRequestedBy is NOT "${this.#CLASS_NAME}": "${this.#windowModeRequestedBy}"`);

      } else {
        const responseMessage = "CANCELED";
        this.debug(`-- Sending responseMessage="${responseMessage}"`);

        try {
          await messenger.runtime.sendMessage(
            { OptionsUIResponse: responseMessage }
          );
        } catch (error) {
          // any need to tell the user???
          this.caught( error,
                       "##### SEND OptionsUIResponse MESSAGE FAILED #####"
                       + `\n- responseMessage="${responseMessage}"`
                     );
        }
      }

      this.debug("-- Closing Our Window");
      window.close();
    }

    this.debug("-- end");
  }



  #getSelectedExtensionCount(e) {
    this.debug("-- begin");

    const domSelectedExtensions = document.querySelectorAll("tr.extension-list-item.selected");
    this.debug(`-- selectedExtensions.length=${domSelectedExtensions.length}`);

    this.debug("-- end");

    return domSelectedExtensions.length;
  }

  #getSelectedExtensionIds(e) {
    this.debug("-- begin");

    const domSelectedExtensions = document.querySelectorAll("tr.extension-list-item.selected");
    this.debug(`-- selectedExtensions.length=${domSelectedExtensions.length}`);
    const selectedExtensions = [];
    for (const domSelectedExtension of domSelectedExtensions) {
      this.debug(`-- selected Extension Id: "${domSelectedExtension.getAttribute("extensionId")}"`);
      selectedExtensions.push(domSelectedExtension.getAttribute("extensionId"));
    }

    this.debug("-- end");

    return selectedExtensions;
  }



  #resetErrors() {
    const errorDivs = document.querySelectorAll("div.errors-panel");
    if (errorDivs) {
      for (const errorDiv of errorDivs) {
        errorDiv.innerHTML = '';
      }
    }
  }

  #setErrorFor(elementId, msgId) {
    if (elementId && msgId) {
      const selector  = `div.errors-panel[errors-for='${elementId}']`;
      const errorsDiv = document.querySelector(selector);

      if (! errorsDiv) {
        this.error(`FAILED TO GET errors-panel DIV: "${selector}"`);
      } else {
        const i18nMessage = utils.getI18nMsg(msgId);

        const errorDiv = document.createElement("div");
          errorDiv.setAttribute("error", "true");
          errorDiv.classList.add("error");
          const errorIconSpan = document.createElement("div");
            errorIconSpan.classList.add("error-icon-large");
          errorDiv.appendChild(errorIconSpan);
          const errorLabel = document.createElement("div");
            errorLabel.classList.add("error-text");
            errorLabel.appendChild( document.createTextNode(i18nMessage) );
          errorDiv.appendChild(errorLabel);
        errorsDiv.appendChild(errorDiv);
      }
    }
  }



  #resetMessages() {
    const messageDivs = document.querySelectorAll("div.messages-panel");
    if (messageDivs) {
      for (const messageDiv of messageDivs) {
        messageDiv.innerHTML = '';
      }
    }
  }

  #setMessageFor(elementId, msgId) {
    if (elementId && msgId) {
      const selector    = `div.messages-panel[messages-for='${elementId}']`;
      const messagesDiv = document.querySelector(selector);

      if (! messagesDiv) {
        this.error(`FAILED TO GET messages-panel DIV: "${selector}"`);
      } else {
        const i18nMessage = utils.getI18nMsg(msgId);

        const messageDiv = document.createElement("div");
          messageDiv.setAttribute("message", "true");
          messageDiv.classList.add("message");
          const messageIconSpan = document.createElement("div");
            messageIconSpan.classList.add("message-icon-large");
          messageDiv.appendChild(messageIconSpan);
          const messageLabel = document.createElement("div");
            messageLabel.classList.add("message-text");
            messageLabel.appendChild( document.createTextNode(i18nMessage) );
          messageDiv.appendChild(messageLabel);
        messagesDiv.appendChild(messageDiv);
      }
    }
  }



  // open ourself as a popup window
  async #showPopupWindow(requestedBy) {
    // don't need to disable the button because it's hidden with all the rest of the UI

    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 700;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");
    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:",
                  `\n- mainWindow.top=${mainWindow.top}`,
                  `\n- mainWindow.left=${mainWindow.left}`,
                  `\n- mainWindow.height=${mainWindow.height}`,
                  `\n- mainWindow.width=${mainWindow.width}`,
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.#fsbOptionsApi.getWindowBounds("optionsWindowBounds"); // use this.#EXT_NAME

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:",
                  `\n- bounds.top=${bounds.top}`,
                  `\n- bounds.left=${bounds.left}`,
                  `\n- bounds.width=${bounds.width}`,
                  `\n- bounds.height=${bounds.height}`,
                );
      popupTop    = bounds.top;
      popupLeft   = bounds.left;
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }

    const requestedByParam = ((typeof requestedBy === 'string') && requestedBy.length > 0)
                             ? `&requestedBy=${encodeURIComponent(requestedBy)}`
                             : '';

    // "?windowMode=true" tells us we're running as a pop window
    // otherwise we don't want to add a window.beforeunload listener: #windowUnloading()
    const optionsUrl         = messenger.runtime.getURL( "optionsUI/optionsUI.html") + "?windowMode=true" + requestedByParam;
    this.#popupOptionsWindow = await messenger.windows.create(
      {
        url:                 optionsUrl,
        type:                "popup",
        titlePreface:        utils.getI18nMsg("options_fsbOptionsTitle", "Options") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug(`-- OptionsUI Popup Window Created -- windowId="${this.#popupOptionsWindow.id}" URL="${optionsUrl}"`);

    // IF WE ARE NOT A POPUP WINDOW, HIDE OUR OWN UI
    if (! this.#windowMode) {
      this.#resetErrors();
      this.#resetMessages();

      this.#setMessageFor("fsbExtensionOptionsTitle", "options_message_usingPopup");

      const extensionOptions = document.getElementById("fsbExtensionOptionsPanel");
      if (! extensionOptions) {
        this.error("FAILED TO GET Extension Options Panel, id='fsbOptionsControlsPanel'");
      } else {
        extensionOptions.style.setProperty('DISPLAY', "NONE");
      }

      const chooserOptions   = document.getElementById("fsbExtensionChooserOptionsWrapper");
      if (! chooserOptions) {
        this.error("FAILED TO GET Chooser Options Panel, id='fsbExtensionChooserOptionsWrapper'");
      } else {
        chooserOptions.style.setProperty('DISPLAY', "NONE");
      }
    }

    // Re-focus on the XXX window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE #popupOptionsPrompt() ???
//  const focusListener = async (windowId) => this.#windowFocusChanged(windowId, ourTabId, ourWindowId, this.#popupOptionsWindow.id);
    const focusListener = null;
//  messenger.windows.onFocusChanged.addListener(focusListener);

    // editorResponse - expected:
    // - null               - the user closed the popup window                 (set by our own windows.onRemoved listener - the defaultResponse sent to popupOptionsPrompt)
    // - CLOSED             - the user closed the popup window                 (sent by the OptionsUI window's window.onClosed listener)
    // - CANCELED           - the user clicked the Cancel button               (sent by the OptionsUI window's Cancel button listener)
    // - { 'ADDED': count } - Extensions added, count is how many (may be 0)   (sent by the OptionsUI window's Save button listener)

    const popupOptionsResponse = await this.#popupOptionsPrompt(this.#popupOptionsWindow.id, focusListener, null);
    this.debug(`-- OptionsUI popupOptionsResponse="${popupOptionsResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (popupOptionsResponse) {
      case 'CANCELED':
      case 'CLOSED':
      case null:
        this.#popupOptionsWindow = undefined;
        break;

      default:
    }

    // IF WE ARE NOT A POPUP WINDOW, RE-BUILD to reflect any changes that might have been mase and RE-SHOW OUR OWN UI
    if (this.#windowMode) {
      this.error("Got Popup Response when in Window Mode???");

    }  else {
      this.debug("Got Popup Response - Re-Building UI and Re-Showing it");
      await this.#buildUI(); // calls #resetErrors() & #resetMessages()

      const extensionOptions = document.getElementById("fsbExtensionOptionsPanel");
      if (! extensionOptions) {
        this.error("FAILED TO GET Extension Options Panel, id='fsbOptionsControlsPanel'");
      } else {
        extensionOptions.style.setProperty('display', "BLOCK");
      }

      const chooserOptions   = document.getElementById("fsbExtensionChooserOptionsWrapper");
      if (! chooserOptions) {
        this.error("FAILED TO GET Chooser Options Panel, id='fsbExtensionChooserOptionsWrapper'");
      } else {
        const accessControlEnabled = await this.#fsbOptionsApi.isEnabledExtensionAccessControl();
        //this.#showHideExtensionAccessControls(accessControlEnabled);
        if (accessControlEnabled) {
          chooserOptions.style.setProperty('display', "BLOCK");
        }
      }
    }
  }

  async #popupOptionsPrompt(popupOptionsWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(popupOptionsWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "-- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId === popupOptionsWindowId) {

                             messenger.runtime.onMessage.removeListener(messageListener);
                             messenger.windows.onRemoved.removeListener(windowRemovedListener);
//////////if (focusListener) messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The OpitionsUI sends a message as OptionsUIResponse:
       *  - CLOSED   - the user closed the popup window                  --  Problem - sometime message "conduit" gets destroyed before message is sent/received
       *  - CANCELED - the user clicked the Done button
       * Save this OptionsUIResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        const senderId       = sender?.id;
        const senderWindowId = sender?.tab?.windowId;
//      console.debug(`\n=====> GOT MESSAGE From Sender="${senderId}" Window="${senderWindowId}" popupOptionsWindowId="${popupOptionsWindowId}":`, request, "\n\n");
        if (senderWindowId === popupOptionsWindowId && request && Object.hasOwn(request, "OptionsUIResponse")) {
//        console.debug(`\n request.OptionsUIResponse="${request.OptionsUIResponse}"`);
          response = request.OptionsUIResponse;
        }
        return false; // we're not sending any reply
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  #getScrollPosition() {
    return {
      x: window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft,
      y: window.scrollY || document.documentElement.scrollTop  || document.body.scrollTop
    };
  }

  #setScrollPosition(position) {
    window.scrollTo(position.x, position.y);
  }
}



var optionsUI  = new OptionsUI();

document.addEventListener("DOMContentLoaded", (e) => optionsUI.init(e), {once: true} );
