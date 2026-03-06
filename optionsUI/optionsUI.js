import { Logger                    } from '../modules/logger.js';
import { FsbOptions                } from '../modules/options.js';
import { FileSystemBrokerCommands  } from '../modules/commands.js';
import { FsbEventLogger            } from '../modules/event_logger.js';
import { FileSystemBrokerAPI       } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { FileSystemBrokerSelfTests } from '../modules/selftests.js';
import { logProps, getExtensionId, isValidExtensionId, getI18nMsg, getI18nMsgSubst, parseDocumentLocation, formatMsToDateTime12HR } from '../modules/utilities.js';


class OptionsUI {

  constructor() {
    this.className                                  = this.constructor.name;
    this.extId                                      = getExtensionId();

    this.INFO                                       = false;
    this.LOG                                        = false;
    this.DEBUG                                      = false;
    this.WARN                                       = false;

    this.EXTENSIONS_STATS_COL_SPAN                  = 4;

    this.logger                                     = new Logger();
    this.fsbOptionsApi                              = new FsbOptions(this.logger);
    this.fsbCommandsApi                             = new FileSystemBrokerCommands(this.logger, this.fsbOptionsApi);
    this.fsbEventLogger                             = new FsbEventLogger(this.logger, this.fsbOptionsApi, this.fsbCommandsApi);
    this.fsBrokerApi                                = new FileSystemBrokerAPI();
    this.fsbOptionsApi.setEventLogger(this.fsbEventLogger);
    this.fsbCommandsApi.setEventLogger(this.fsbEventLogger);

    this.windowMode                                 = false; // are we running in a popup window??? (from the windowMode parameter in our URL)
    this.windowModeRequestedBy                      = undefined;

    this.editorModeAdd                              = false;
    this.editorModeEdit                             = false;
    this.editorEditExtensionId                      = undefined;

    this.prevFocusedWindow                          = undefined;

    this.showExtensionStats                         = false;
    this.fsbStats;

    this.extensionOptionsTitleClickTimeout          = null;  // for detecting single- vs double-click
    this.EXTENSION_OPTIONS_TITLE_CLICK_DELAY        = 500;   // 500ms, 1/2 second (the JavaScript runtime does not guarantee this time - it's single-threaded)

    this.extensionItemClickTimeout                  = null;  // for detecting single- vs double-click
    this.EXTENSION_ITEM_CLICK_DELAY                 = 500;   // 500ms, 1/2 second (the JavaScript runtime does not guarantee this time - it's single-threaded)

    this.devDeleteOldEventLogsTimeout               = null;
    this.devRemovedUninstalledExtensionsTimeout     = null;

    // gather i18n messages for tooltips (and some other stuff) in the Extension List
    // - the calls to getI18nMsg for tooltips will return null - NOT the message ID - if no message is configured - just no tooltip
    this.tooltip_check_allowAccess                                         = getI18nMsg( "options_check_allowAccess.tooltip",            null );
    this.tooltip_button_add                                                = getI18nMsg( "options_button_addExtension.tooltip",          null );
    this.tooltip_button_edit                                               = getI18nMsg( "options_button_editExtension.tooltip",         null );
    this.tooltip_button_delete                                             = getI18nMsg( "options_button_deleteExtension.tooltip",       null );
    this.tooltip_button_edit_save                                          = getI18nMsg( "options_fsbExtensionEditSaveButton.tooltip",   null );
    this.tooltip_button_edit_add                                           = getI18nMsg( "options_fsbExtensionEditAddButton.tooltip",    null );
    this.tooltip_button_edit_cancel                                        = getI18nMsg( "options_fsbExtensionEditCancelButton.tooltip", null );

    this.extensionListHeader_text_installed                                  = getI18nMsg("options_fsbExtensionListHeader_text_installed.label");
    this.extensionListHeader_text_enabled                                    = getI18nMsg("options_fsbExtensionListHeader_text_enabled.label");
    this.extensionListHeader_text_id                                         = getI18nMsg("options_fsbExtensionListHeader_text_id.label");
    this.extensionListHeader_text_name                                       = getI18nMsg("options_fsbExtensionListHeader_text_name.label");
    this.extensionListHeader_text_dirExists                                  = getI18nMsg("options_fsbExtensionListHeader_text_dirExists.label");
    this.extensionListHeader_text_itemCount                                  = getI18nMsg("options_fsbExtensionListHeader_text_itemCount.label");
    this.extensionListHeader_text_totalSizeFmt                               = getI18nMsg("options_fsbExtensionListHeader_text_totalSizeFmt.label");
    this.extensionListHeader_text_totalSizeBytes                             = getI18nMsg("options_fsbExtensionListHeader_text_totalSizeBytes.label");

    this.extensionListHeader_tooltip_installed                               = getI18nMsg("options_fsbExtensionListHeader_tooltip_installed.label");
    this.extensionListHeader_tooltip_enabled                                 = getI18nMsg("options_fsbExtensionListHeader_tooltip_enabled.label");
    this.extensionListHeader_tooltip_id                                      = getI18nMsg("options_fsbExtensionListHeader_tooltip_id.label");
    this.extensionListHeader_tooltip_name                                    = getI18nMsg("options_fsbExtensionListHeader_tooltip_name.label");
    this.extensionListHeader_tooltip_dirExists                               = getI18nMsg("options_fsbExtensionListHeader_tooltip_dirExists.label");
    this.extensionListHeader_tooltip_itemCount                               = getI18nMsg("options_fsbExtensionListHeader_tooltip_itemCount.label");
    this.extensionListHeader_tooltip_totalSizeFmt                            = getI18nMsg("options_fsbExtensionListHeader_tooltip_totalSizeFmt.label");
    this.extensionListHeader_tooltip_totalSizeBytes                          = getI18nMsg("options_fsbExtensionListHeader_tooltip_totalSizeBytes.label");

    this.extensionListEditorTitleAddMode                                   = getI18nMsg("options_fsbExtensionEditTitleAddMode");
    this.extensionListEditorTitleEditMode                                  = getI18nMsg("options_fsbExtensionEditTitleEditMode");
    this.extensionListEditErrorExtensionIdEmpty                            = getI18nMsg("options_fsbExtensionEditErrorExtensionIdEmpty");
    this.extensionListEditErrorExtensionIdInvalid                          = getI18nMsg("options_fsbExtensionEditErrorExtensionIdInvalid");
    this.extensionListEditErrorExtensionIdExists                           = getI18nMsg("options_fsbExtensionEditErrorExtensionIdExists");
    this.extensionListEditErrorExtensionNameEmpty                          = getI18nMsg("options_fsbExtensionEditErrorExtensionNameEmpty");
    this.extensionListEditErrorExtensionNameInvalid                        = getI18nMsg("options_fsbExtensionEditErrorExtensionNameInvalid");
    this.extensionListEditErrorAddFailed                                   = getI18nMsg("options_fsbExtensionEditErrorAddFailed");
    this.extensionListEditErrorUpdateFailed                                = getI18nMsg("options_fsbExtensionEditErrorUpdateFailed");

    // developer options
    this.i18n_label_dev_options_title                                      = getI18nMsg("options_fsbDevOptionsTitle.label");
    this.i18n_check_dev_skipOnboarding                                     = getI18nMsg("options_fsbDevSkipOnboardingCheck.label");
    this.i18n_check_dev_showOptionsWindowOnStartup                         = getI18nMsg("options_fsbDevShowOptionsWindowOnStartupCheck.label");
    this.i18n_button_dev_resetOptions                                      = getI18nMsg("options_fsbDevResetOptionsButton.label");
    this.i18n_button_dev_runSelfTest                                       = getI18nMsg("options_fsbDevSelfTestButton.label");
    this.i18n_button_dev_displayOptionsAsPopup                             = getI18nMsg("options_fsbDevDisplayOptionsAsPopupButton.label");
    //
    this.i18n_button_dev_deleteOldEventLogs                                = getI18nMsg("options_fsbDevDeleteOldEventLogsButton.label");
    this.i18n_label_dev_deleteOldEventLogsOlderThanNumDaysLabel            = getI18nMsg("options_fsbDevDeleteOldEventLogsOlderThanNumDaysLabel" );
    this.i18n_label_dev_deleteOldEventLogsOlderThanDaysLabel               = getI18nMsg("options_fsbDevDeleteOldEventLogsOlderThanDaysLabel" );
    this.i18n_label_dev_deleteOldEventLogsInNumMinutesLabel                = getI18nMsg("options_fsbDevDeleteOldEventLogsInNumMinutesLabel" );
    this.i18n_label_dev_deleteOldEventLogsInMinutesLabel                   = getI18nMsg("options_fsbDevDeleteOldEventLogsInMinutesLabel" );
    this.i18n_label_dev_deleteOldEventLogsInNumSecondsLabel                = getI18nMsg("options_fsbDevDeleteOldEventLogsInNumSecondsLabel" );
    this.i18n_label_dev_deleteOldEventLogsInSecondsLabel                   = getI18nMsg("options_fsbDevDeleteOldEventLogsInSecondsLabel" );
    //
    this.i18n_button_dev_removeUninstalledExtensions                       = getI18nMsg("options_fsbDevRemoveUninstalledExtensionsButton.label");
    this.i18n_label_dev_removeExtensionsUninstalledMoreThanNumDaysAgoLabel = getI18nMsg("options_fsbDevRemoveExtensionsUninstalledMoreThanNumDaysAgoLabel" );
    this.i18n_label_dev_removeExtensionsUninstalledMoreThanDaysAgoLabel    = getI18nMsg("options_fsbDevRemoveExtensionsUninstalledMoreThanDaysAgoLabel" );
    this.i18n_label_dev_removeUninstalledExtensionsInNumMinutesLabel       = getI18nMsg("options_fsbDevRemoveUninstalledExtensionsInNumMinutesLabel" );
    this.i18n_label_dev_removeUninstalledExtensionsInMinutesLabel          = getI18nMsg("options_fsbDevRemoveUninstalledExtensionsInMinutesLabel" );
    this.i18n_label_dev_removeUninstalledExtensionsInNumSecondsLabel       = getI18nMsg("options_fsbDevRemoveUninstalledExtensionsInNumSecondsLabel" );
    this.i18n_label_dev_removeUninstalledExtensionsInSecondsLabel          = getI18nMsg("options_fsbDevRemoveUninstalledExtensionsInSecondsLabel" );
  }



  log(...info) {
    if (this.LOG) this.logger.log(this.className, ...info);
  }

  logAlways(...info) {
    this.logger.logAlways(this.className, ...info);
  }

  debug(...info) {
    if (this.DEBUG) this.logger.debug(this.className, ...info);
  }

  debugAlways(...info) {
    this.logger.debugAlways(this.className, ...info);
  }

  error(...info) {
    // always log errors
    this.logger.error(this.className, ...info);
  }

  caught(e, msg, ...info) {
    // always log exceptions
    this.logger.error( this.className,
                       msg,
                       "\n name:    " + e.name,
                       "\n message: " + e.message,
                       "\n stack:   " + e.stack,
                       ...info
                     );
  }



  async init(e) {
    this.debug("-- begin");

    const docLocationInfo = parseDocumentLocation(document);
    const params          = docLocationInfo.params;
    if (params) {
      const windowMode = params.get('windowMode');
      this.debug(`-- windowMode="${windowMode}"`);

      this.windowMode = (windowMode === 'true') ? true : false;

      if (this.windowMode) {
        const requestedBy = params.get('requestedBy');
        this.debug(`-- windowMode requestedBy="${requestedBy}"`);
        if ((typeof requestedBy === 'string') && requestedBy.length > 0) {
          this.windowModeRequestedBy = requestedBy;
        }
      }
    }

    if (false) {
      var parameters;

      parameters = { 'includeChildInfo': true };
      const stats1 = await this.fsBrokerApi.stats(parameters); // get statitics for our own extension directory
      this.debugAlways("\n\n========== EXTENSION STATS1 ==========\n", stats1, "\n\n========== EXTENSION STATS1 ==========\n\n");

      parameters = { 'includeChildInfo': true, 'types': ['regular'] };
      const stats2 = await this.fsBrokerApi.stats(parameters); // get statitics for our own extension directory
      this.debugAlways("\n\n========== EXTENSION STATS2 ==========\n", stats2, "\n\n========== EXTENSION STATS2 ==========\n\n");

      parameters = { 'matchGLOB': '*', 'types': ['directory','regular'] };
      const info1 = await this.fsBrokerApi.fsbListInfo(parameters); // using messaging
      this.debugAlways("\n\n========== FSB INFO1 ==========\n", info1, "\n\n========== FSB INFO1 ==========\n\n");
      const info2 = await this.fsbCommandsApi.fsbListInfo(parameters); // direct call, no messaging
      this.debugAlways("\n\n========== FSB INFO2 ==========\n", info2, "\n\n========== FSB INFO2 ==========\n\n");

      parameters = { 'matchGLOB': '*', 'types': ['directory','regular'] };
      const list1 = await this.fsBrokerApi.fsbList(parameters); // using messaging
      this.debugAlways("\n\n========== FSB LIST1 ==========\n", list1, "\n\n========== FSB LIST1 ==========\n\n");
      const list2 = await this.fsbCommandsApi.fsbList(parameters); // direct call, no messaging
      this.debugAlways("\n\n========== FSB LIST2 ==========\n", list2, "\n\n========== FSB LIST2 ==========\n\n");

      parameters = { 'matchGLOB': '*', 'types': ['directory'] };
      const list3 = await this.fsBrokerApi.fsbList(parameters); // using messaging
      this.debugAlways("\n\n========== FSB LIST3 ==========\n", list3, "\n\n========== FSB LIST3 ==========\n\n");
      const list4 = await this.fsbCommandsApi.fsbList(parameters); // direct call, no messaging
      this.debugAlways("\n\n========== FSB LIST4 ==========\n", list4, "\n\n========== FSB LIST4 ==========\n\n");

      const fsbStats1 = await this.fsBrokerApi.fsbStats(); // using messaging
      this.debugAlways("\n\n========== FSB STATS1 ==========\n", fsbStats1, "\n\n========== FSB STATS1 ==========\n\n");
      const fsbStats2 = await this.fsbCommandsApi.fsbStats(); // direct call, no messaging
      this.debugAlways("\n\n========== FSB STATS2 ==========\n", fsbStats2, "\n\n========== FSB STATS2 ==========\n\n");
    }

    await this.localizePage();
    await this.applyTooltips(document);
    await this.buildUI();
    await this.setupListeners();

    this.debug("-- end");
  }



  async windowUnloading(e) {
    if (this.DEBUG) this.debugAlways( "--- WINDOW UNLOADING ---"
                                      + `\n- this.windowMode=${this.windowMode}`
                                      + `\n- window.screenTop=${window.screenTop}`
                                      + `\n- window.screenLeft=${window.screenLeft}`
                                      + `\n- window.outerWidth=${window.outerWidth}`
                                      + `\n- window.outerHeight=${window.outerHeight}`
                                    );

    // We should NOT even have been called unless windowMode=true,
    // otherwise we would NOT have been added as a listnener in the first place, no???
    // But what the heck...
    if (this.windowMode) {
      await this.fsbOptionsApi.storeWindowBounds("optionsWindowBounds", window);

      if (this.DEBUG) {
        const bounds = await this.fsbOptionsApi.getWindowBounds("optionsWindowBounds");

        if (! bounds) {
          this.debugAlways("--- WINDOW UNLOADING --- Retrieve Stored Window Bounds - FAILED TO GET bounds ---");
        } else if (typeof bounds !== 'object') {
          this.debugAlways(`--- WINDOW UNLOADING --- Retrieve Stored Window Bounds - bounds IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
        } else {
          this.debugAlways( "--- Retrieve Stored Window Bounds ---"
                            + `\n- bounds.top:    ${bounds.top}`
                            + `\n- bounds.left:   ${bounds.left}`
                            + `\n- bounds.width:  ${bounds.width}`
                            + `\n- bounds.height: ${bounds.height}`
                          );
        }
      }
    }

    // Tell Thunderbird to close the window
    e.returnValue = '';  // any "non-truthy" value will do
    return false;
  }



  async localizePage() { // we could pass this the Document and then we could move it to utilities.js
    this.debug("-- start");

    for (const el of document.querySelectorAll("[data-l10n-id]")) {
      const id = el.getAttribute("data-l10n-id");
      const i18nMessage = getI18nMsg(id);
      el.textContent = i18nMessage;
    }

    for (const el of document.querySelectorAll("[data-html-l10n-id]")) {
      const id = el.getAttribute("data-html-l10n-id");
      const i18nMessage = getI18nMsg(id);
      el.insertAdjacentHTML('afterbegin', i18nMessage);
    }

    this.debug("-- end");
  }



  async applyTooltips(theDocument) { // we could move this to utilities.js
    this.debug("-- start");

    for (const el of theDocument.querySelectorAll("[tooltip-l10n-id]")) {
      const id = el.getAttribute("tooltip-l10n-id");
      const i18nMessage = getI18nMsg(id);
      el.setAttribute("title", i18nMessage);
    }

    this.debug("-- end");
  }



  async setupListeners() {
    this.debug(`-- start -- windowMode=${this.windowMode}`);

    document.addEventListener( "change", (e) => this.optionChanged(e) );   // One of the checkboxes or radio buttons, etc, was clicked or a select has changed
    document.addEventListener( "click",  (e) => this.actionClicked(e) );   // An Actions button was clicked (or a label, since <label for="xx"> does not work)

    const extensionOptionsTitleDiv = document.querySelector("#fsbExtensionOptionsTitle");
    if (extensionOptionsTitleDiv) {
      document.addEventListener( "dblclick",  (e) => this.extensionOptionsTitleDivDoubleClicked(e) );
    }

    if (this.windowMode) {
      this.debug("-- Adding beforeunload Window Event Listener");
      window.addEventListener("beforeunload", (e) => this.windowUnloading(e));
    }

    this.debug("-- end");
  }



  async buildUI() {
    this.debug("-- start");

    this.resetErrors();

    const accessControlEnabled = await this.fsbOptionsApi.isEnabledExtensionAccessControl();
    const checkPanel           = document.getElementById("fsbShowGrantExtensionAccessDialogCheckPanel");
    const chooserOptionsPanel  = document.getElementById("fsbExtensionChooserOptionsWrapper");
    if (accessControlEnabled) {
      checkPanel.style.setProperty('display', 'block');
      chooserOptionsPanel.style.setProperty('display', 'block');
    } else {
      checkPanel.style.setProperty('display', 'none');
      chooserOptionsPanel.style.setProperty('display', 'none');
    }

    const showLoggingOptions = await this.fsbOptionsApi.isEnabledShowLoggingOptions();
    this.showHideLoggingOptions(showLoggingOptions);

    const showHints = await this.fsbOptionsApi.isEnabledShowOptionsHints();
    this.showHideHints(showHints);

    const showActions = await this.fsbOptionsApi.isEnabledShowOptionsActions();
    this.showHideActions(showActions);

    const isEnabledShowDeveloperOptions = await this.fsbOptionsApi.isEnabledOption("fsbShowDeveloperOptions");
    if (isEnabledShowDeveloperOptions) {
      await this.addDeveloperOptions();
    } else {
      this.removeDeveloperOptions();
    }

    this.populateSelectUIs();
    await this.updateOptionsUI();
    await this.buildExtensionsListUI();
    this.enableExtensionAccessControls(true);

    this.debug("-- end");
  }



  populateSelectUIs() {
    this.populateAutoLogPurgeDaysSelectUI();
    this.populateAutoRemoveUninstalledExtensionsDaysSelectUI();
  }

  populateAutoLogPurgeDaysSelectUI() {
    const select = document.getElementById("fsbAutoLogPurgeDays");
    if (select) {
      var option = document.createElement("option");
        option.value = 0;
        option.textContent = getI18nMsg("options_fsbAutoLogPurgeDaysSelect_optionNone");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 2;
        option.textContent = getI18nMsg("options_fsbAutoLogPurgeDaysSelect_2Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 3;
        option.textContent = getI18nMsg("options_fsbAutoLogPurgeDaysSelect_3Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 4;
        option.textContent = getI18nMsg("options_fsbAutoLogPurgeDaysSelect_4Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 5;
        option.textContent = getI18nMsg("options_fsbAutoLogPurgeDaysSelect_5Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 6;
        option.textContent = getI18nMsg("options_fsbAutoLogPurgeDaysSelect_6Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 7;
        option.textContent = getI18nMsg("options_fsbAutoLogPurgeDaysSelect_7Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 10;
        option.textContent = getI18nMsg("options_fsbAutoLogPurgeDaysSelect_10Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 14;
        option.textContent = getI18nMsg("options_fsbAutoLogPurgeDaysSelect_14Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 21;
        option.textContent = getI18nMsg("options_fsbAutoLogPurgeDaysSelect_21Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 30;
        option.textContent = getI18nMsg("options_fsbAutoLogPurgeDaysSelect_30Days");
      select.appendChild(option);
    }
  }

  populateAutoRemoveUninstalledExtensionsDaysSelectUI() {
    const select = document.getElementById("fsbAutoRemoveUninstalledExtensionsDays");
    if (select) {
      var option;

      option = document.createElement("option");
        option.value = -1;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_optionDisabled");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 0;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_optionWhenUninstalled");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 1;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_1Day");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 2;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_2Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 3;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_3Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 4;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_4Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 5;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_5Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 6;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_6Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 7;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_7Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 10;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_10Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 14;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_14Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 21;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_21Days");
      select.appendChild(option);

      option = document.createElement("option");
        option.value = 30;
        option.textContent = getI18nMsg("options_fsbAutoRemoveUninstalledExtensionsDaysSelect_30Days");
      select.appendChild(option);
    }
  }



  async refreshUI(e) { // the event is not used - is it even useful?
    this.debug("-- start");

    await this.buildExtensionsListUI(e);
    this.enableExtensionAccessControls(true);

    this.debug("-- end");
  }



  enableExtensionAccessControls(enable) {
    this.debug(`-- start -- enable=${enable}`);

    const extensionSelected = this.getSelectedExtensionCount() > 0;

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



  async updateOptionsUI() {
    this.debug("-- start");

    const options = await this.fsbOptionsApi.getAllOptions();

    this.debug("-- sync options to UI");
    for (const [optionName, optionValue] of Object.entries(options)) {
      this.debug("-- option: ", optionName, "value: ", optionValue);

      if (this.fsbOptionsApi.isDefaultOption(optionName)) { // MABXXX WHY WHY WHY???
        const optionElement = document.getElementById(optionName);

        if (optionElement && optionElement.classList.contains("fsbGeneralOption")) {
          if (optionElement.tagName === 'INPUT') {
            if (optionElement.type === 'checkbox') {
              optionElement.checked = optionValue;
            } else if (optionElement.type === 'radio') {
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
    }

    this.debug("-- end");
  }



  async buildExtensionsListUI(e) { // the event is not used - is it even useful?
    this.debug("-- start");

    this.resetErrors();

    const domFsbExtensionList = document.getElementById("fsbExtensionList");
    if (! domFsbExtensionList) {
      this.error("-- Failed to find #fsbExtensionList");
      this.setErrorFor("fsbExtensionOptionsTitle", "options_message_error_noExtensionList");
      return;
    }

    // Empty the any current Extension IDs List and add the "Loading Extension IDs List" DIV
    domFsbExtensionList.innerHTML = '';
    const i18nMessage = getI18nMsg("options_fsbExtensionsLoadingMessage", "...");
    const loadingDiv = document.createElement("tr");
    loadingDiv.classList.add("extension-loading");
    loadingDiv.appendChild( document.createTextNode(i18nMessage) );
    domFsbExtensionList.appendChild(loadingDiv);

    // get extension stats
    const response = await this.fsbCommandsApi.fsbStats();
    if (response && response.stats && (typeof response.stats) === 'object') {
      this.showExtensionStats = true;
      this.fsbStats = response.stats;
    }

    // Remove the "Loading Extension IDs List" DIV and build the actual List UI
    domFsbExtensionList.innerHTML = '';

    const extensionListHeaderItemUI = this.buildExtensionListHeaderItemUI();
    domFsbExtensionList.appendChild(extensionListHeaderItemUI);

    const extensionEditTitleUI = this.buildExtensionEditTitleItemUI();
    domFsbExtensionList.appendChild(extensionEditTitleUI);

    const extensionEditUI = this.buildExtensionEditItemUI();
    domFsbExtensionList.appendChild(extensionEditUI);

    const extensionEditErrorUI = this.buildExtensionEditErrorItemUI();
    domFsbExtensionList.appendChild(extensionEditErrorUI);

    const allExtensionsProps = await this.fsbOptionsApi.getExtensionsPropsSortedByName();
    if (this.DEBUG) {
      this.logAlways(`-- typeof allExtensionsProps='${typeof allExtensionsProps}'`);
      logProps("", "buildExtensionsListUI.allExtensionsProps", allExtensionsProps);
    }

    if (typeof allExtensionsProps !== 'object') {
      this.error("-- allExtensionsProps is NOT an object");

    } else {
      if (this.DEBUG) {
        this.debugAlways("-- Extension Props, length=" + Object.entries(allExtensionsProps).length);
        logProps("", "buildExtensionsListUI.Extension Props", allExtensionsProps);
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

        var extDirStats = (this.fsbStats && this.fsbStats.dirStats && (extensionId in this.fsbStats.dirStats)) ? this.fsbStats.dirStats[extensionId] : null;

        const extensionListItemUI = await this.buildExtensionListItemUI(extensionId, extensionProps, extDirStats, extensionInfo);
        domFsbExtensionList.appendChild(extensionListItemUI);

        this.debug(`-- finished adding Extension -- extensionId="${extensionId}"`);
      }
    }

    this.debug("-- end");
  }



  buildExtensionListHeaderItemUI() {
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
        extensionInstalledTH.setAttribute("title", this.extensionListHeader_tooltip_installed);
        const extensionInstalledLabel = document.createElement("label");
          extensionInstalledLabel.appendChild( document.createTextNode(this.extensionListHeader_text_installed) );
        extensionInstalledTH.appendChild(extensionInstalledLabel);
      thead.appendChild(extensionInstalledTH);

      const extensionEnabledTH = document.createElement("th");
        extensionEnabledTH.classList.add("extension-head-data");            // extension-head-item > extension-head-data
        extensionEnabledTH.setAttribute("title", this.extensionListHeader_tooltip_enabled);
        const extensionEnabledLabel = document.createElement("label");
          extensionEnabledLabel.appendChild( document.createTextNode(this.extensionListHeader_text_enabled) );
        extensionEnabledTH.appendChild(extensionEnabledLabel);
      thead.appendChild(extensionEnabledTH);

      const extensionNameTH = document.createElement("th");
        extensionNameTH.classList.add("extension-head-data");            // extension-head-item > extension-head-data
        extensionNameTH.setAttribute("title", this.extensionListHeader_tooltip_name);
        const extensionNameLabel = document.createElement("label");
          extensionNameLabel.appendChild( document.createTextNode(this.extensionListHeader_text_name) );
        extensionNameTH.appendChild(extensionNameLabel);
      thead.appendChild(extensionNameTH);

      const extensionIdTH = document.createElement("th");
        extensionIdTH.classList.add("extension-head-data");              // extension-head-item > extension-head-data
        extensionIdTH.setAttribute("title", this.extensionListHeader_tooltip_id);
        const extensionIdLabel = document.createElement("label");
          extensionIdLabel.appendChild( document.createTextNode(this.extensionListHeader_text_id) );
        extensionIdTH.appendChild(extensionIdLabel);
      thead.appendChild(extensionIdTH);

      if (this.showExtensionStats) {
        const extensionDirExistsTH = document.createElement("th");
          extensionDirExistsTH.setAttribute("title", this.extensionListHeader_tooltip_dirExists);
          extensionDirExistsTH.classList.add("extension-head-data");     // extension-head-item > extension-head-data
          const extensionDirExistsLabel = document.createElement("label");
            extensionDirExistsLabel.appendChild( document.createTextNode(this.extensionListHeader_text_dirExists) );
          extensionDirExistsTH.appendChild(extensionDirExistsLabel);
        thead.appendChild(extensionDirExistsTH);

        const extensionItemCountTH = document.createElement("th");
          extensionItemCountTH.setAttribute("title", this.extensionListHeader_tooltip_itemCount);
          extensionItemCountTH.classList.add("extension-head-data");  // extension-head-item > extension-head-data
          const extensionItemCountLabel = document.createElement("label");
            extensionItemCountLabel.appendChild( document.createTextNode(this.extensionListHeader_text_itemCount) );
          extensionItemCountTH.appendChild(extensionItemCountLabel);
        thead.appendChild(extensionItemCountTH);

        const extensionTotalSizeFmtTH = document.createElement("th");
          extensionTotalSizeFmtTH.setAttribute("title", this.extensionListHeader_tooltip_totalSizeFmt);
          extensionTotalSizeFmtTH.classList.add("extension-head-data");  // extension-head-item > extension-head-data
          const extensionTotalSizeFmtLabel = document.createElement("label");
            extensionTotalSizeFmtLabel.appendChild( document.createTextNode(this.extensionListHeader_text_totalSizeFmt) );
          extensionTotalSizeFmtTH.appendChild(extensionTotalSizeFmtLabel);
        thead.appendChild(extensionTotalSizeFmtTH);

        const extensionTotalSizeBytesTH = document.createElement("th");
          extensionTotalSizeBytesTH.setAttribute("title", this.extensionListHeader_tooltip_totalSizeBytes);
          extensionTotalSizeBytesTH.classList.add("extension-head-data");// extension-head-item > extension-head-data
          const extensionTotalSizeBytesLabel = document.createElement("label");
            extensionTotalSizeBytesLabel.appendChild( document.createTextNode(this.extensionListHeader_text_totalSizeBytes) );
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
            addButton.classList.add("icon-only");                  // extension-head-item > extension-head-controls-right > extension-edit-controls > icon-only
            addButton.classList.add("add-extension");              // extension-head-item > extension-head-controls-right > extension-edit-controls > add-extension
            if (this.tooltip_button_add) addButton.setAttribute("title", this.tooltip_button_add);
            addButton.addEventListener("click", (e) => this.extensionControlButtonClicked(e));
          editControlsDiv.appendChild(addButton);

//        const deleteButton = document.createElement("button");
//          deleteButton.classList.add("extension-head-button");    // extension-head-item > extension-head-controls-right > extension-edit-controls > extension-head-button
//          deleteButton.classList.add("extension-icon-button");    // extension-head-item > extension-head-controls-right > extension-edit-controls > extension-icon-button
//          deleteButton.classList.add("icon-only");                // extension-head-item > extension-head-controls-right > extension-edit-controls > icon-only
//          deleteButton.classList.add("remove-extension");         // extension-head-item > extension-head-controls-right > extension-edit-controls > remove-extension
//          deleteButton.setAttribute("extensionId", extensionId);
//          if (this.tooltip_button_delete) deleteButton.setAttribute("title", this.tooltip_button_delete);
//          if (locked) {
//            deleteButton.disabled = true;
//          } else {
//            deleteButton.addEventListener("click", (e) => this.extensionControlButtonClicked(e));
//          }
//        editControlsDiv.appendChild(deleteButton);
        controlsRightTH.appendChild(editControlsDiv);
      thead.appendChild(controlsRightTH);

    return thead;
  }



  buildExtensionEditTitleItemUI() {
    const extensionEditTitleTR = document.createElement("tr");
      extensionEditTitleTR.setAttribute("id", "extension_edit_title");
      extensionEditTitleTR.classList.add("extension-edit-title-item");              // extension-edit-title_item
      extensionEditTitleTR.classList.add('display-none');                           // HIDE the Row - turn ON display: none

      var span = 5;
      if (this.showExtensionStats) span += this.EXTENSIONS_STATS_COL_SPAN;

      // Create Extension Title Text element and add it to the row
      const extensionTitleTextTD = document.createElement("td");
        extensionTitleTextTD.setAttribute("colspan", span.toString());
        extensionTitleTextTD.classList.add("extension-edit-title-data");            // extension-edit-title-item > extension-edit-title-data
        const extensionTitleTextLabel = document.createElement("label");
          extensionTitleTextLabel.setAttribute("id", "extension_edit_title_text");  // extension-edit-title-item > extension-edit-title-data > #extension_edit_text
        extensionTitleTextTD.appendChild(extensionTitleTextLabel);
      extensionEditTitleTR.appendChild(extensionTitleTextTD);

      // Create controls-right element and add it to the row
      const emptyRightTD = document.createElement("td");
        emptyRightTD.classList.add("extension-edit-title-empty");                   // extension-edit-title-item > extension-edit-title-empty
      extensionEditTitleTR.appendChild(emptyRightTD);

    return extensionEditTitleTR;
  }



  buildExtensionEditItemUI() {
    const extensionEditTR = document.createElement("tr");
      extensionEditTR.setAttribute("id", "extension_edit");
      extensionEditTR.classList.add("extension-edit-item");                   // extension-edit-item
      extensionEditTR.classList.add('display-none');                          // HIDE the Editor Fields Row - turn ON display: none

      // Create allow access checkbox inside a TD and add it to the row
      const controlsLeftTD = document.createElement("td");
        controlsLeftTD.classList.add("extension-edit-controls-left");         // extension-edit-item > extension-edit-controls-left
        const allowAccessCheck = document.createElement("input");
          allowAccessCheck.setAttribute("type", "checkbox");
          allowAccessCheck.classList.add("extension-edit-check");             // extension-edit-item > extension-edit-controls-left > extension-edit-check
          allowAccessCheck.setAttribute("id", "extension_edit_allow_access_check");
          allowAccessCheck.checked = false;
          if (this.tooltip_check_allowAccess) allowAccessCheck.setAttribute("title", this.tooltip_check_allowAccess);
          allowAccessCheck.addEventListener("change", (e) => this.extensionOptionCheckClicked(e), true); // <====== NOTE: event "capturing" phase
        controlsLeftTD.appendChild(allowAccessCheck);
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
          extensionNameText.setAttribute("id", "extension_edit_text_name");   // extension-edit-item > extension-edit-data > #extension_edit_text_name
          extensionNameText.classList.add("extension-edit-text");             // extension-edit-item > extension-edit-data > extension-edit-text
          extensionNameText.classList.add("no-css");                          // Tell userContent.css NOT to change me!!!
        extensionNameTD.appendChild(extensionNameText);
      extensionEditTR.appendChild(extensionNameTD);

      // Create Extension Id element and add it to the row
      const extensionIdTD = document.createElement("td");
        extensionIdTD.classList.add("extension-edit-data");                   // extension-edit-item > extension-edit-data
        const extensionIdText = document.createElement("input");
          extensionIdText.setAttribute("type", "text");
          extensionIdText.setAttribute("id", "extension_edit_text_id");       // extension-edit-item > extension-edit-data > #extension_edit_text_id
          extensionIdText.classList.add("extension-edit-text");               // extension-edit-item > extension-edit-data > extension-edit-text
          extensionIdText.classList.add("no-css");                            // Tell userContent.css NOT to change me!!!
        extensionIdTD.appendChild(extensionIdText);
      extensionEditTR.appendChild(extensionIdTD);

      if (this.showExtensionStats) {
        const extensionStatsTD = document.createElement("td");
          extensionStatsTD.classList.add("extension-edit-data");             // extension-edit-item > extension-edit-data
          extensionStatsTD.setAttribute("colspan", this.EXTENSIONS_STATS_COL_SPAN.toString());
        extensionEditTR.appendChild(extensionStatsTD);
      }

      // Create controls-right element and add it to the row
      const controlsRightTD = document.createElement("td");
        controlsRightTD.classList.add("extension-edit-controls-right");       // extension-edit-item > extension-edit-controls-right

        const editControlsDiv = document.createElement("div");
          editControlsDiv.classList.add("extension-controls-panel");          // extension-edit-item > extension-edit-controls-right > extension-controls-panel
          editControlsDiv.classList.add("edit-controls");                     // extension-edit-item > extension-edit-controls-right > edit-controls

          const cancelButton = document.createElement("button");
            cancelButton.classList.add("extension-edit-button");              // extension-edit-item > extension-edit-controls-right > edit-controls > extension-edit-button
            cancelButton.classList.add("extension-icon-button");              // extension-edit-item > extension-edit-controls-right > edit-controls > extension-icon-button
            cancelButton.classList.add("icon-only");                          // extension-edit-item > extension-edit-controls-right > edit-controls > icon-only
            cancelButton.setAttribute("id", "extensionEditCancelButton");
            cancelButton.addEventListener("click", (e) => this.extensionControlButtonClicked(e));
            if (this.tooltip_button_delete) cancelButton.setAttribute("title", this.tooltip_button_edit_cancel);
          editControlsDiv.appendChild(cancelButton);

          const saveButton = document.createElement("button");
            saveButton.classList.add("extension-edit-button");                // extension-edit-item > extension-edit-controls-right > edit-controls > extension-edit-button
            saveButton.classList.add("extension-icon-button");                // extension-edit-item > extension-edit-controls-right > edit-controls > extension-icon-button
            saveButton.classList.add("icon-only");                            // extension-edit-item > extension-edit-controls-right > edit-controls > icon-only
            saveButton.setAttribute("id", "extensionEditSaveButton");
            saveButton.addEventListener("click", (e) => this.extensionControlButtonClicked(e));
            if (this.tooltip_button_edit) saveButton.setAttribute("title", this.tooltip_button_edit_save);
            // this.tooltip_button_edit_add ???
          editControlsDiv.appendChild(saveButton);
        controlsRightTD.appendChild(editControlsDiv);
      extensionEditTR.appendChild(controlsRightTD);

    return extensionEditTR;
  }



  buildExtensionEditErrorItemUI() {
    const extensionEditErrorTR = document.createElement("tr");
      extensionEditErrorTR.setAttribute("id", "extension_edit_error");
      extensionEditErrorTR.classList.add("extension-edit-error-item");              // extension-edit-error_item
      extensionEditErrorTR.classList.add('display-none');                           // HIDE the Row - turn ON display: none

      // Create space for the allow-access-check checkbox column TD and add it to the row
      const extensionEditErrorLeftIconsTD = document.createElement("td");
        extensionEditErrorLeftIconsTD.classList.add("extension-edit-error-left-icons");  // extension-edit-error-item > extension-edit-error-left-icons
        const extensionErrorIconSpan = document.createElement("span");
          extensionErrorIconSpan.classList.add("extension-edit-error-icon");
          const extensionErrorIcon = document.createElement("img");
            extensionErrorIcon.setAttribute("src", "../images/icons/forbidden_16x16.png");
          extensionErrorIconSpan.appendChild(extensionErrorIcon);
        extensionEditErrorLeftIconsTD.appendChild(extensionErrorIconSpan);
      extensionEditErrorTR.appendChild(extensionEditErrorLeftIconsTD);

      // Create space element for Installed & Enabled elements and add it to the row
      const extensionInstalledEnabledTD = document.createElement("td");
        extensionInstalledEnabledTD.classList.add("extension-edit-error-data");     // extension-edit-error-item > extension-edit-error-data
        extensionInstalledEnabledTD.setAttribute("colspan", "2");
      extensionEditErrorTR.appendChild(extensionInstalledEnabledTD);

      // Create Extension Name Error element and add it to the row
      const extensionNameTD = document.createElement("td");
        extensionNameTD.classList.add("extension-edit-error-data");                 // extension-edit-error-item > extension-edit-error-data
        const extensionNameErrorLabel = document.createElement("label");
          extensionNameErrorLabel.classList.add("extension-edit-error-label");
          extensionNameErrorLabel.setAttribute("id", "extension_edit_error_name");  // extension-edit-error-item > extension-edit-error-data > #extension_edit_name
        extensionNameTD.appendChild(extensionNameErrorLabel);
      extensionEditErrorTR.appendChild(extensionNameTD);

      // Create Extension Id Error element and add it to the row
      const extensionIdTD = document.createElement("td");
        extensionIdTD.classList.add("extension-edit-error-data");                   // extension-edit-error-item > extension-edit-error-data
        const extensionIdErrorLabel = document.createElement("label");
          extensionIdErrorLabel.classList.add("extension-edit-error-label");
          extensionIdErrorLabel.setAttribute("id", "extension_edit_error_id");      // extension-edit-error-item > extension-edit-error-data > #extension_edit_error_id
        extensionIdTD.appendChild(extensionIdErrorLabel);
      extensionEditErrorTR.appendChild(extensionIdTD);

      if (this.showExtensionStats) {
        const extensionStatsTD = document.createElement("td");
          extensionStatsTD.classList.add("extension-edit-error-data");             // extension-edit-error-item > extension-edit-error-data
          extensionStatsTD.setAttribute("colspan", this.EXTENSIONS_STATS_COL_SPAN.toString());
        extensionEditErrorTR.appendChild(extensionStatsTD);
      }

      // Create controls-right element and add it to the row
      const emptyRightTD = document.createElement("td");
        emptyRightTD.classList.add("extension-edit-error-empty");                   // extension-edit-error-item > extension-edit-error-empty
      extensionEditErrorTR.appendChild(emptyRightTD);

    return extensionEditErrorTR;
  }



  // async just because of formatFileSize()
  async buildExtensionListItemUI(extensionId, props, extDirStats, extInfo) {
    const installed      = extInfo ? true                : false;
    const extensionName  = extInfo ? extInfo.name        : ( ! props || typeof props.name        !== 'string'  ) ? ''    : props.name;
    const description    = extInfo ? extInfo.description : ( ! props || typeof props.description !== 'string'  ) ? ''    : props.description;
    const disabled       = extInfo ? ! extInfo.enabled   : ( ! props || typeof props.disabled    !== 'boolean' ) ? false : props.disabled;
    const extIdFromProps =                                 ( ! props || typeof props.id          !== 'string'  ) ? ''    : props.id;
    const allowAccess    =                                 ( ! props || typeof props.allowAccess !== 'boolean' ) ? true  : props.allowAccess;
    const locked         =                                 ( ! props || typeof props.locked      !== 'boolean' ) ? false : props.locked;

    this.debug( "\n--- BUILD LIST ITEM UI:",
                `\n- extensionId ......... "${extensionId}"`,
                `\n- props.id ............ "${props.id}"`,
                `\n- props.name .......... "${props.name}"`,
                `\n- props.description ... "${props.description}"`,
                `\n- allowAccess ......... ${allowAccess}`,
                `\n- locked .............. ${locked}`,
                `\n- installed ........... ${installed}`,
                `\n- disabled ............ ${disabled}`,
                `\n- allowAccess ......... ${allowAccess}`,
              );

    if (extIdFromProps !== extensionId) {
      this.error(`-- EXTENSION ID MISMATCH -- extensionId="${extensionId}" extIdFromProps="${extIdFromProps}"`);
    }

    if (extInfo && extInfo.id !== extensionId) {
      this.error(`-- EXTENSION ID MISMATCH -- extensionId="${extensionId}" extInfo.id="${extInfo.id}"`);
    }

    const extensionTR = document.createElement("tr");
                                     extensionTR.classList.add( "extension-list-item" );               // extension-list-item
      if (installed)                 extensionTR.classList.add( "extension-installed" );
      if (locked)                    extensionTR.classList.add( "extension-locked"    );
      if (disabled)                  extensionTR.classList.add( "extension-disabled"  );
      if (! allowAccess && ! locked) extensionTR.classList.add( "access-disallowed"   );

                       extensionTR.setAttribute( "extensionId",   extensionId   );
                       extensionTR.setAttribute( "extensionName", extensionName );
      if (description) extensionTR.setAttribute( "title",         description   );


      if (! locked) {
        extensionTR.addEventListener("click",    (e) => this.extensionClicked(e),       true); // <====== NOTE: true: event "capturing" phase
        extensionTR.addEventListener("dblclick", (e) => this.extensionDoubleClicked(e), true); // <====== NOTE: true: event "capturing" phase
      }

      // Create allow-access-check checkbox inside a TD and add it to the row
      const controlsLeftTD = document.createElement("td");
        controlsLeftTD.classList.add("extension-list-controls-left");   // extension-list-item > extension-list-controls-left

        const allowAccessCheck = document.createElement("input");
          allowAccessCheck.setAttribute("type", "checkbox");
          allowAccessCheck.classList.add("extension-list-check");       // extension-list-item > extension-list-controls-left > extension-list-check
          allowAccessCheck.classList.add("allow-access-check");         // extension-list-item > extension-list-controls-left > allow-access-check
          allowAccessCheck.setAttribute("extensionId", extensionId);
          if (this.tooltip_check_allowAccess) allowAccessCheck.setAttribute("title", this.tooltip_check_allowAccess);
          if (locked) {
            allowAccessCheck.checked = true;
            allowAccessCheck.disabled = true;
          } else {
            allowAccessCheck.checked = allowAccess;
            allowAccessCheck.addEventListener("change", (e) => this.extensionOptionCheckClicked(e), true); // <====== NOTE: event "capturing" phase
          }
          //
        controlsLeftTD.appendChild(allowAccessCheck);
      extensionTR.appendChild(controlsLeftTD);

      // Create Extension Installed element and add it to the row
      const extensionInstalledTD = document.createElement("td");
        extensionInstalledTD.classList.add("extension-list-data");             // extension-list-item > extension-list-data
        extensionInstalledTD.classList.add("data-boolean");                    // extension-list-item > data-boolean
        extensionInstalledTD.classList.add("extension-list-installed");        // extension-list-item > extension-list-installed
        const extensionInstalledDotSpan = document.createElement("td");
          extensionInstalledDotSpan.classList.add("data-boolean-dot");         // extension-list-item > extension-list-data > data-boolean-dot
          if (installed) {
            extensionInstalledDotSpan.classList.add("dot-ext-installed");      // extension-list-item > extension-list-data > dot-ext-installed
          } else {
            extensionInstalledDotSpan.classList.add("dot-ext-not-installed");  // extension-list-item > extension-list-data > dot-ext-not-installed
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
            } else {
              extensionEnabledDotSpan.classList.add("dot-ext-enabled");                  // extension-list-item > extension-list-data > dot-ext-enabled
            }
          } else {
            extensionEnabledDotSpan.classList.add("dot-ext-not-enabled-not-installed");  // extension-list-item > extension-list-data > dot-ext-not-enabled-not-installed
          }
        extensionEnabledTD.appendChild(extensionEnabledDotSpan);
      extensionTR.appendChild(extensionEnabledTD);

      // Create Extension Name element and add it to the row
      const extensionNameTD = document.createElement("td");
        extensionNameTD.classList.add("extension-list-data");           // extension-list-item > extension-list-data
        extensionNameTD.classList.add("extension-list-name");           // extension-list-item > extension-list-name
        extensionNameTD.appendChild( document.createTextNode(extensionName) );
      extensionTR.appendChild(extensionNameTD);

      // Create Extension Id element and add it to the row
      const extensionIdTD = document.createElement("td");
        extensionIdTD.classList.add("extension-list-data");             // extension-list-item > extension-list-data
        extensionIdTD.classList.add("extension-list-id");               // extension-list-item > extension-list-id
        extensionIdTD.appendChild( document.createTextNode(extensionId) );
      extensionTR.appendChild(extensionIdTD);

      if (this.showExtensionStats) {
        // Create Extension DirectoryExists element and add it to the row
        const extensionDirExistsTD = document.createElement("td");
          extensionDirExistsTD.classList.add("extension-list-data");                 // extension-list-item > extension-list-data
          extensionDirExistsTD.classList.add("data-boolean");                        // extension-list-item > data-boolean
          extensionDirExistsTD.classList.add("extension-list-stats-dir-exists");     // extension-list-item > extension-list-stats-dir-exists

          const extensionDirExistsDotSpan = document.createElement("td");
            extensionDirExistsDotSpan.classList.add("data-boolean-dot");             // extension-list-item > extension-list-data > data-boolean-dot
            if (extDirStats) {
              extensionDirExistsDotSpan.classList.add("dot-stats-dir-exists");       // extension-list-item > extension-list-data > dot-stats-dir-exists
            } else {
              extensionDirExistsDotSpan.classList.add("dot-stats-not-dir-exists");   // extension-list-item > extension-list-data > dot-stats-not-dir-exists
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
          } else {
            extensionItemCountTD.appendChild( document.createTextNode("-") );
          }
        extensionTR.appendChild(extensionItemCountTD);

        // Create Extension TotalSize (formatted) element and add it to the row
        const extensionTotalSizeFmtTD = document.createElement("td");
          extensionTotalSizeFmtTD.classList.add("extension-list-data");                 // extension-list-item > extension-list-data
          extensionTotalSizeFmtTD.classList.add("data-numeric");                        // extension-list-item > data-numeric
          extensionTotalSizeFmtTD.classList.add("extension-list-stats-total-size-fmt"); // extension-list-item > extension-list-stats-total-size-fmt
          if (extDirStats) {
            extensionTotalSizeFmtTD.appendChild( document.createTextNode( await messenger.messengerUtilities.formatFileSize( extDirStats.size_total ) ) );
          } else {
            extensionTotalSizeFmtTD.appendChild( document.createTextNode("-") );
          }
        extensionTR.appendChild(extensionTotalSizeFmtTD);

        // Create Extension TotalSize (in bytes) element and add it to the row
        const extensionTotalSizeBytesTD = document.createElement("td");
          extensionTotalSizeBytesTD.classList.add("extension-list-data");                   // extension-list-item > extension-list-data
          extensionTotalSizeBytesTD.classList.add("data-numeric");                          // extension-list-item > data-numeric
          extensionTotalSizeBytesTD.classList.add("extension-list-stats-total-size-bytes"); // extension-list-item > extension-list-stats-total-size-bytes
          if (extDirStats) {
            extensionTotalSizeBytesTD.appendChild( document.createTextNode( extDirStats.size_total.toString() ) );
          } else {
            extensionTotalSizeBytesTD.appendChild( document.createTextNode("-") );
          }
        extensionTR.appendChild(extensionTotalSizeBytesTD);
      }

      // Create controls-right element and add it to the row
      const controlsRightTD = document.createElement("td");
        controlsRightTD.classList.add("extension-list-controls-right"); // extension-list-item > extension-list-controls-right

        const editControlsDiv = document.createElement("div");
          editControlsDiv.classList.add("extension-controls-panel");    // extension-list-item > extension-list-controls-right > extension-controls-panel
          editControlsDiv.classList.add("edit-controls");               // extension-list-item > extension-list-controls-right > edit-controls
          editControlsDiv.classList.add("extension-edit-controls");     // extension-list-item > extension-list-controls-right > extension-edit-controls

          const editButton = document.createElement("button");
            editButton.classList.add("extension-list-button");      // extension-list-item > extension-list-controls-right > extension-edit-controls > extension-list-button
            editButton.classList.add("extension-icon-button");      // extension-list-item > extension-list-controls-right > extension-edit-controls > extension-icon-button
            editButton.classList.add("icon-only");                  // extension-list-item > extension-list-controls-right > extension-edit-controls > icon-only
            editButton.classList.add("edit-extension");             // extension-list-item > extension-list-controls-right > extension-edit-controls > edit-extension
            editButton.setAttribute("extensionId", extensionId);
            if (this.tooltip_button_edit) editButton.setAttribute("title", this.tooltip_button_edit);
            if (locked) {
              editButton.disabled = true;
            } else {
              editButton.addEventListener("click", (e) => this.extensionControlButtonClicked(e));
            }
          editControlsDiv.appendChild(editButton);

          const deleteButton = document.createElement("button");
            deleteButton.classList.add("extension-list-button");    // extension-list-item > extension-list-controls-right > extension-edit-controls > extension-list-button
            deleteButton.classList.add("extension-icon-button");    // extension-list-item > extension-list-controls-right > extension-edit-controls > extension-icon-button
            deleteButton.classList.add("icon-only");                // extension-list-item > extension-list-controls-right > extension-edit-controls > icon-only
            deleteButton.classList.add("remove-extension");         // extension-list-item > extension-list-controls-right > extension-edit-controls > remove-extension
            deleteButton.setAttribute("extensionId", extensionId);
            if (this.tooltip_button_delete) deleteButton.setAttribute("title", this.tooltip_button_delete);
            if (locked) {
              deleteButton.disabled = true;
            } else {
              deleteButton.addEventListener("click", (e) => this.extensionControlButtonClicked(e));
            }
          editControlsDiv.appendChild(deleteButton);
        controlsRightTD.appendChild(editControlsDiv);
      extensionTR.appendChild(controlsRightTD);

    return extensionTR;
  }



  async insertExtensionsListItemUI(extensionId, extensionProps) {
    this.debug( "--"
                + `\n- extensionId="${extensionId}"`
                + `\n- extensionProps.id="${extensionProps.id}"`
                + `\n- extensionProps.name="${extensionProps.name}"`
                + `\n- extensionProps.allowAccess"${extensionProps.allowAccess}`
              );

    const extensionName = extensionProps.name;

    const domFsbExtensionList = document.getElementById("fsbExtensionList");

    const extensionTR = await this.buildExtensionListItemUI(extensionId, extensionProps);

    var inserted = false;
    const domExtensionListItems = domFsbExtensionList.children;
    for (const domExtensionListItemTR of domExtensionListItems) {
      if (domExtensionListItemTR.classList.contains("extension-list-item")) {
        const domExtensionName = domExtensionListItemTR.getAttribute("extensionName");
        const compared = domExtensionName.localeCompare(extensionName, { 'sensitity': 'base' } );
        this.debug(`-- extensionName="${extensionName}" domExtensionName="${domExtensionName}" compared=${compared}`);

        if (compared >= 0) {
          this.debug(`-- INSERTING extensionName="${extensionName}" BEFORE domExtensionName="${domExtensionName}"`);
          domFsbExtensionList.insertBefore(extensionTR, domExtensionListItemTR);
          inserted = true;
          break;
        }
      }
    }

    if (! inserted) {
      this.debug(`-- Insertion point not found -- Appending to end of list --  extensionId="${extensionId}"`);
      domFsbExtensionList.appendChild(extensionTR);
    }
  }



  async updateExtensionsListItemUI(oldExtensionId, newExtensionId, extensionProps) {
    this.debug( "--"
                + `\n- oldExtensionId="${oldExtensionId}"`
                + `\n- newExtensionId="${newExtensionId}"`
                + `\n- extensionProps.id="${extensionProps.id}"`
                + `\n- extensionProps.name="${extensionProps.name}"`
                + `\n- extensionProps.allowAccess="${extensionProps.allowAccess}`
              );

    const domFsbExtensionList = document.getElementById("fsbExtensionList");
    const selectorTR          = `tr.extension-list-item[extensionId='${oldExtensionId}']`
    const extensionTR         = domFsbExtensionList.querySelector(selectorTR);

    if (! extensionTR) {
      this.debug(`-- QUERY FAILED TO GET EXTENSION ITEM TR -- selector="${selectorTR}"`);

    } else {
      if (newExtensionId !== oldExtensionId) {
        // if IDs are NOT the same, delete old, insert new
        // MABXXX SHOULD WE DOUBLE-CHECK TO SEE IF newExtensionId ALREADY EXISTS???
        extensionTR.remove();
        await this.insertExtensionsListItemUI(newExtensionId, extensionProps);

      } else {
        // if IDs ARE the same, a simple update
        const selectorAllowAccessCheck = `input.allow-access-check[type='checkbox'][extensionId='${oldExtensionId}']`
        const selectorNameTD           = ".extension-list-name";
        const selectorIdTD             = ".extension-list-id";

        const allowAccessCheck         = extensionTR.querySelector(selectorAllowAccessCheck);
        const nameTD                   = extensionTR.querySelector(selectorNameTD);
        const idTD                     = extensionTR.querySelector(selectorIdTD);

        if (extensionProps.allowAccess) {
          extensionTR.classList.remove('access-disallowed');
        } else {
          extensionTR.classList.add('access-disallowed');
        }

        if (! allowAccessCheck) {
          this.debug(`-- QUERY FAILED TO GET EXTENSION ITEM allowAccess Check -- selector="${selectorAllowAccessCheck}"`);
        } else {
          allowAccessCheck.checked = extensionProps.allowAccess;
        }

        if (! nameTD) {
          this.debug(`-- QUERY FAILED TO GET EXTENSION ITEM Name TD -- selector="${selectorNameTD}"`);
        } else {
          nameTD.textContent = extensionProps.name;
        }

        if (! idTD) {
          this.debug(`-- QUERY FAILED TO GET EXTENSION ITEM ID TD -- selector="${selectorIdTD}"`);
        } else {
          idTD.textContent = extensionProps.id;
        }
      }
    }
  }



  // Some input element on the Page was changed.
  //
  // Check to see if one of the Options checkboxes or radio buttons (etc) has been clicked or a select has changed
  //
  // NOTE: This listener is set on the DOCUMENT!!!
  async optionChanged(e) {
    if (e === null) return;
    this.debug(`-- tagName="${e.target.tagName}" type="${e.target.type}" fsbGeneralOption? ${e.target.classList.contains("fsbGeneralOption")} id="${e.target.id}"`);

    this.resetErrors();

    var target = e.target;
    if ( ! target.classList.contains('fsbGeneralOption') ) {

      this.debug(`-- Event Target Element '${target.tagName}' classList does not contain class 'fsbGeneralOption'`);

    } else {

      if (target.tagName === "INPUT") {
        switch (target.type) {
          case 'checkbox':
          case 'radio': {
              const optionName  = target.id;
              const optionValue = target.checked;

              /* if it's a radio button, set the values for all the other buttons in the group to false */
              if (target.type === "radio") { // is it a radio button?
                this.debug(`-- radio buttton selected ${optionName}=<${optionValue}> - group=${target.name}`);

                // first, set this option
                this.debug(`optionChanged -- Setting 'input' type='radio' Option {[${optionName}]: ${optionValue}}`);
                await this.fsbOptionsApi.storeOption(
                  { [optionName]: optionValue }
                );

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
                          await this.fsbOptionsApi.storeOption(
                            { [radio.id]: false }
                          );
                        }
                      }
                    }
                  }
                }

              } else {

                this.debug(`-- Setting 'input' type='checkbox' Option {[${optionName}]: ${optionValue}}`);
                await this.fsbOptionsApi.storeOption(
                  { [optionName]: optionValue }
                );

                // special processing for these checkboxes
                switch (optionName) {
                  case "fsbExtensionAccessControlEnabled":
                    this.extensionAccessControlCheckClicked(e, optionValue);
                    break;
                  case "fsbShowLoggingOptions":
                    this.showHideLoggingOptions(optionValue);
                    break;
                  case "fsbShowOptionsHints":
                    this.showHideHints(optionValue);
                    break;
                  case "fsbShowOptionsActions":
                    this.showHideActions(optionValue);
                    break;
                }
              }

              break;
            }

          case 'email':
          case 'number':
          case 'password':
          case 'text': {
              const optionName  = target.id;
              const optionValue = target.value;
              this.debug(`-- Setting 'input' type='${tag.type}' Option {[${optionName}]: ${optionValue}}`);
              await this.fsbOptionsApi.storeOption(
                { [optionName]: optionValue }
              );

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
            optionValue = Number(optionValue);
            if (Number.isNaN(optionValue)) {
              optionValue = 14; // 14 is the default
              // target.value = optionValue; ??? // MABXXX fix it???
            }
            break;
          case 'fsbAutoRemoveUninstalledExtensionsDays':
            optionValue = Number(optionValue);
            if (Number.isNaN(optionValue)) {
              optionValue = 2; // 2 is the default
              // target.value = optionValue; ??? // MABXXX fix it???
            }
            break;
        }

        this.debug(`-- Setting 'select' Option {[${optionName}]: ${optionValue}}`);
        await this.fsbOptionsApi.storeOption(
          { [optionName]: optionValue }
        );

      } else if (target.tagName === 'TEXTAREA') {

        this.debug("-- Not configured to handle 'textarea' changed events");

      } else {

        this.debug(`-- Not configured to handle '${target.tagName}' changed events`);

      }
    }
  }



  extensionAccessControlCheckClicked(e, checked) {
    const checkPanel          = document.getElementById("fsbShowGrantExtensionAccessDialogCheckPanel");
    const chooserOptionsPanel = document.getElementById("fsbExtensionChooserOptionsWrapper");
    if (checked) {
      checkPanel.style.setProperty('display', 'block');
      chooserOptionsPanel.style.setProperty('display', 'block');
    } else {
      checkPanel.style.setProperty('display', 'none');
      chooserOptionsPanel.style.setProperty('display', 'none');
    }
  }



  showHideHints(show) {
    const hintsPanel = document.getElementById("fsbHintsPanel");
    if (hintsPanel) {
      if (show) {
        hintsPanel.style.setProperty('display', 'block');
      } else {
        hintsPanel.style.setProperty('display', 'none');
      }
    }
  }



  showHideActions(show) {
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



  showHideLoggingOptions(show) {
    const loggingOptionsPanel = document.getElementById("fsbLoggingOptions");
    if (loggingOptionsPanel) {
      if (show) {
        loggingOptionsPanel.style.setProperty('display', 'block');
      } else {
        loggingOptionsPanel.style.setProperty('display', 'none');
      }
    }
  }



  // the user clicked an extension-head-button or extension-list-button or extension-edit-button: .edit-extension, .remove-extension, etc
  async extensionControlButtonClicked(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    this.resetErrors();

    this.debug("-- begin");

    if (this.DEBUG) this.debugAlways( "--" // don't build all this just to be denied by this.DEBUG inside this.debug()
                                      + `\n- tagName="${e.target.tagName}"`
                                      + `\n- extension-head-button?=${e.target.classList.contains("extension-head-button")}`
                                      + `\n- extension-list-button?=${e.target.classList.contains("extension-list-button")}`
                                      + `\n- extension-edit-button?=${e.target.classList.contains("extension-edit-button")}`
                                      + `\n- add-extension?=${e.target.classList.contains("add-extension")}`
                                      + `\n- edit-extension?=${e.target.classList.contains("edit-extension")}`
                                      + `\n- remove-extension?=${e.target.classList.contains("remove-extension")}`
                                      + `\n- extensionId="${e.target.getAttribute('extensionId')}"`
                                    );

    var button;
    if (e.target.tagName === "BUTTON") {
      button = e.target;
    } else if (e.target.tagName === "LABEL" && e.target.parentElement && e.target.parentElement.tagName === "BUTTON") {
      button = e.target.parentElement;
    }

    if (button) {
      if (button.classList.contains("extension-edit-button")) {
        const buttonId = button.getAttribute("id");
        this.debug(`-- got edit button class "extension-edit-button", buttonId="${buttonId}"`);

        switch (buttonId) {
          case "extensionEditCancelButton":
            await this.extensionEditCancelButtonClicked(e);
            break;
          case "extensionEditSaveButton":
            await this.extensionEditSaveButtonClicked(e);
            break;
          default:
            this.debug(`-- UNKNOWN extension-edit-button BUTTON --  buttonId="${buttonId}"`);
        }

      } else if (button.classList.contains("extension-head-button")) {
        if (button.classList.contains("add-extension")) {
          await this.addNewExtension(e);
        }

      } else if (button.classList.contains("extension-list-button")) {
        if ( button.classList.contains("edit-extension")
             || button.classList.contains("remove-extension")
           )
        {
          if (! button.hasAttribute("extensionId")) {
            this.error("-- Cannot Edit or Remove - Button has no \"extensionId\" Atttribute!!!");

          } else {
            const extensionId = button.getAttribute("extensionId");
            const selectorTR  = `tr.extension-list-item[extensionId='${extensionId}']`;
            const extensionTR = e.target.closest(selectorTR);

            if (extensionTR.classList.contains("extension-locked"))  {
              // Should never happen - We should not have added an event listener to this TR
              this.error(`-- Cannot Edit or Delete - Extension is LOCKED: extensionId="${extensionId}"`);

            } else {
              if (button.classList.contains("edit-extension")) {
                await this.editExtension(e, extensionId);

              } else if (button.classList.contains("remove-extension")) {
                await this.removeExtension(e, extensionId);
              }
            }
          }
        } else {
          this.debug("-- NOT OUR BUTTON -- got expected class \"extension-list-button\", but noot expected button-specific class --");
        }
      } else {
        this.debug("-- NOT OUR BUTTON -- expected class \"extension-edit-button\" or \"extension-list-button\" not found --");
      }
    } else {
      this.debug("-- BUTTON NOT EXPECTED --");
    }

    this.debug("-- end");
  }



  async extensionEditSaveButtonClicked(e) {
    e.preventDefault();

    this.debug( "--"
                + `\n- this.editorModeAdd         = ${this.editorModeAdd}`
                + `\n- this.editorModeEdit        = ${this.editorModeEdit}`
                + `\n- this.editorEditExtensionId = "${this.editorEditExtensionId}"`
              );

    this.resetErrors();

    if (! this.editorModeAdd && ! this.editorModeEdit) {
      this.error("-- NEITHER editorModeAdd NO editorModeEdit IS SET!!!");
      this.setErrorFor("fsbExtensionOptionsTitle", "options_message_error_editorModeNotSet");

    } else {
      const allowAccessCheck      = document.getElementById("extension_edit_allow_access_check");
      const extensionIdText       = document.getElementById("extension_edit_text_id");
      const extensionNameText     = document.getElementById("extension_edit_text_name");
      const extensionEditErrorTR  = document.getElementById("extension_edit_error");
      const nameErrorLabel        = document.getElementById("extension_edit_error_name");
      const idErrorLabel          = document.getElementById("extension_edit_error_id");

      const newExtensionId   = extensionIdText.value;
      const newExtensionName = extensionNameText.value;
      const newAllowAccess   = allowAccessCheck.checked;

      nameErrorLabel.textContent = '';
      idErrorLabel.textContent   = '';

      var errors = 0;
      if (! newExtensionName) {
        this.debug("-- Empty Extension Name");
        nameErrorLabel.textContent = this.extensionListEditErrorExtensionNameEmpty;
        errors++;
      }

      if (! newExtensionId) {
        this.debug("-- Empty Extension ID");
        idErrorLabel.textContent = this.extensionListEditErrorExtensionIdEmpty;
        errors++;
      } else if ( ! isValidExtensionId(newExtensionId, true) ) { // allowUpperCase=true // && (newExtensionId !== this.editorEditExtensionId) ???
        this.debugAlways(`-- Invalid Extension ID: "${newExtensionId}"`);
        idErrorLabel.textContent = this.extensionListEditErrorExtensionIdInvalid;
        errors++;
      }

      if (! errors) {
        if (this.editorModeAdd) {
          // What if NEW Extension ID already exists???
          const props = await this.fsbOptionsApi.getExtensionPropsById(newExtensionId);
          if (props) {
            this.debug(`-- editorModeAdd -- EXTENSION ID ALREADY EXISTS newExtensionId="${newExtensionId}"`);
            idErrorLabel.textContent = this.extensionListEditErrorExtensionIdExists;
            errors++;

          } else {
            const newProps = await this.fsbOptionsApi.addOrUpdateExtension(undefined, newExtensionId, newExtensionName, newAllowAccess);

            if (! newProps) {
              this.error("-- editorModeAdd -- Options.addOrUpdateExtension FAILED TO RETURN NEW EXTENSION PROPERTIES");
              nameErrorLabel.textContent = this.extensionListEditErrorAddFailed;
//////////////idErrorLabel.textContent   = this.extensionListEditErrorAddFailed;
              errors++;

            } else {
              // this will place the new one in the correct location in the sort order
              await this.insertExtensionsListItemUI(newExtensionId, newProps);
            }
          }

        } else if (this.editorModeEdit) {
          // did they change the Extension ID???
          if (newExtensionId !== this.editorEditExtensionId) {
            // What if NEW Extension ID already exists???
            const props = await this.fsbOptionsApi.getExtensionPropsById(newExtensionId);
            if (props) {
              this.debug(`-- editorModeEdit -- EXTENSION ID ALREADY EXISTS: newExtensionId="${newExtensionId}"`);
              idErrorLabel.textContent = this.extensionListEditErrorExtensionIdExists;
              errors++;
            }
          }

          if (! errors) {
            const newProps = await this.fsbOptionsApi.addOrUpdateExtension(this.editorEditExtensionId, newExtensionId, newExtensionName, newAllowAccess);

            if (! newProps) {
              this.error("-- editorModeEdit -- Options.addOrUpdateExtension FAILED TO RETURN NEW EXTENSION PROPERTIES");
              nameErrorLabel1.textContent = this.extensionListEditErrorUpdateFailed;
//////////////idErrorLabel2.textContent   = this.extensionListEditErrorUpdateFailed;
              errors++;

            } else {
              // this will delete the old one if the extension ID changed
              // and place the new one in the correct location in the sort order
              await this.updateExtensionsListItemUI(this.editorEditExtensionId, newExtensionId, newProps);
            }
          }
        }
      }

      if (errors) {
        extensionEditErrorTR.classList.remove('display-none');

      } else {
        this.exitEditMode();
      }
    }
  }

  async extensionEditCancelButtonClicked(e) {
    e.preventDefault();

    this.resetErrors();

    this.debug("--");
    this.exitEditMode();
  }

  exitEditMode() {
    this.debug("-- begin");

    const extensionListTable      = document.getElementById("fsbExtensionList");
    const extensionEditTitleTR    = document.getElementById("extension_edit_title");
    const extensionEditTitleLabel = document.getElementById("extension_edit_title_text");
    const extensionEditTR         = document.getElementById("extension_edit");
    const allowAccessCheck        = document.getElementById("extension_edit_allow_access_check");
    const extensionIdText         = document.getElementById("extension_edit_text_id");
    const extensionNameText       = document.getElementById("extension_edit_text_name");
    const extensionEditErrorTR    = document.getElementById("extension_edit_error");
    const nameErrorLabel          = document.getElementById("extension_edit_error_name");
    const idErrorLabel            = document.getElementById("extension_edit_error_id");

    extensionListTable.classList.remove("edit-mode");

    extensionEditTitleTR.classList.add('display-none'); // HIDE the Editor Title Row - turn ON display: none
    extensionEditTitleLabel.textContent = '';

    extensionEditTR.classList.add('display-none'); // HIDE the Editor Fields Row - turn ON display: none
    allowAccessCheck.checked   = false;
    extensionIdText.value      = '';
    extensionNameText.value    = '';

    extensionEditErrorTR.classList.add('display-none'); // HIDE the Editor Fields Error Row - turn ON display: none
    nameErrorLabel.textContent = '';
    idErrorLabel.textContent   = '';

    var selector;
    var element;

    selector = "button.add-extension"; // extension-head-item > extension-head-controls-right > extension-edit-controls > add-extension
    element = extensionListTable.querySelector(selector);
    if (! element) {
      this.debug(`-- Failed to select ADD Extension Button, selector="${selector}"`);
    } else {
      element.disabled = false;
    }

    // ENABLE ALL THE EDIT & DELETE BUTTONS (skip any Extension that is LOCKED)
    const domExtensionTRs = document.querySelectorAll("tr.extension-list-item");
    this.debug(`-- domExtensionTRs.length=${domExtensionTRs.length}`);
    for (const domExtensionTR of domExtensionTRs) {

      const extensionId = domExtensionTR.getAttribute("extensionId");
      const locked      = domExtensionTR.classList.contains("extension-locked");

      if (locked) {
        this.debug(`-- Extension is LOCKED: extensionId="${extensionId}"`);

      } else {
        this.debug(`-- Enabling controls for Extension: extensionId="${extensionId}"`);

        selector = `input[type='checkbox'].allow-access-check[extensionId='${extensionId}']`;
        element = domExtensionTR.querySelector(selector);
        if (! element) {
          this.debug(`-- Failed to select ALLOW ACCESS Checkbox for Extension: extensionId="${extensionId}" selector="${selector}"`);
        } else {
          element.disabled = false;
        }

        selector = `button.edit-extension[extensionId='${extensionId}']`;
        element = domExtensionTR.querySelector(selector);
        if (! element) {
          this.debug(`-- Failed to select EDIT Button for Extension: extensionId="${extensionId}" selector="${selector}"`);
        } else {
          element.disabled = false;
        }

        selector = `button.remove-extension[extensionId='${extensionId}']`;
        element = domExtensionTR.querySelector(selector);
        if (! element) {
          this.debug(`-- Failed to select DELETE Button for Extension: extensionId="${extensionId}" selector="${selector}"`);
        } else {
          element.disabled = false;
        }
      }
    }

    this.enableExtensionAccessControls(true);

    this.editorModeAdd         = false;
    this.editorModeEdit        = false;
    this.editorEditExtensionId = undefined;

    this.debug("-- end");
  }



  // the user clicked a allowAccess checkbox for an Extension, etc
  async extensionOptionCheckClicked(e) {
    if (e === null) return;

    this.resetErrors();

    this.debug("-- begin");
    if (this.DEBUG) this.debugAlways( "--" // don't build all this just to be denied by this.DEBUG in this.debug()
                                      + `\n- tagName ................. "${e.target.tagName}"`
                                      + `\n- type .................... "${e.target.type}"`
                                      + `\n- id ...................... "${e.target.getAttribute('id')}"`
                                      + `\n- extension-edit-check? ... ${e.target.classList.contains('extension-edit-check')}`
                                      + `\n- extension-list-check? ... ${e.target.classList.contains('extension-list-check')}`
                                      + `\n- allow-access-check? ..... ${e.target.classList.contains('allow-access-check')}`
                                      + `\n- extensionId ............. "${e.target.getAttribute('extensionId')}"`
                                    );

    // MABXXX I thought the browser was supposed to take care of this <label> with a "for" attribute stuff...
    var target = e.target;
    if (e.target.tagName === 'LABEL') {
      const forID = e.target.getAttribute("for");
      this.debug(`-- LABEL CLICKED -- id="${e.target.getAttribute('id')}" forId="${forId}" `);

      if (forId) {
        const forElement = document.getElementById(forId);
        if (forElement) {
          target = forElement
          this.debugs(`-- LABEL CLICKED, FOR ELEMENT FOUND -- id="${target.getAttribute('id')}"`);
        }
      }
    }

    if ( target
         && target.tagName === 'INPUT'
         && target.type === 'checkbox'
         && ( ( target.classList.contains("extension-list-check")
                && ( target.classList.contains("allow-access-check")
                     || target.classList.contains("XXX-check") // Just a place-holder for future expansion
                   )
              )
              || target.classList.contains("extension-edit-check")
            )
       )
    {
//////e.stopPropagation();
      e.stopImmediatePropagation();

      if (e.target.classList.contains("extension-edit-check")) {
        const checked    = e.target.checked;
        const checkboxId = e.target.getAttribute("id");
        switch (checkboxId) {
          case "extension_edit_allow_access_check":
            // The "Allow Access" checkbox on the Extension Editor was clicked - nothing to do... change the background color???
            break;
        }

      } else if (! e.target.hasAttribute("extensionId")) { // if it doesn't have an extensionId then we can't store
        this.error("-- I DIDN'T GET AN \"extensionId\" - I CAN'T DO ANYTHING!!!");

      } else {
        const checked     = e.target.checked;
        const extensionId = e.target.getAttribute("extensionId");
        const props       = await this.fsbOptionsApi.getExtensionPropsById(extensionId);

        if (! props) {
          this.debug(`-- PROPS NOT FOUND -- extensionId="${extensionId}"`);

        } else {
          // is it an allowAccess checkbox?
          if (e.target.classList.contains("allow-access-check")) { // extension-list-item > extension-list-controls-left > allow-access-check
            await this.allowAccessCheckboxClicked(e, extensionId, props, checked);

          } else if (e.target.classList.contains("XXX-check")) { // extension-list-item > extension-list-controls-left > XXX-check
            // Just a place-holder for future expansion

          } else {
            // We don't know exactly which checkbox it is!!!  The outer "if" test should have prevented this
            this.debug("-- NOT OUR CHECKBOX --");
          }
        }
      }
    } else {
      this.debug("-- NOT OUR CHECKBOX --");
    }

    this.debug("-- end");
  }



  async allowAccessCheckboxClicked(e, extensionId, props, allowAccess) {
    this.debug(`-- OLD PROPS: props.id="${props.id}" props.name="${props.name}" allowAccess=${props.allowAccess}`);
    this.debug(`-- NEW allowAccess=${allowAccess}`);

    this.resetErrors();

    // find the TR.extension-list-item and set the classes and/or attributes
    const extensionSelector     = `tr.extension-list-item[extensionId='${extensionId}']`
    const domSelectedExtension  = document.querySelector(extensionSelector);
    if (! domSelectedExtension) {
      this.debug(`(allowAccess) -- DID NOT FIND OUR extension-list-item: "${extensionSelector}"`);

    } else if (domSelectedExtension.classList.contains("extension-locked")) {
      this.debug(`-- extension is LOCKED`);

    } else {
      this.debug(`(allowAccess) -- Found our extension-list-item: "${extensionSelector}"`);

      props['allowAccess'] = allowAccess;
      this.debug("-- new allowAccess checkbox status: ", props);

      await this.fsbOptionsApi.storeExtensionPropsById(extensionId, props);

      if (allowAccess) {
        this.debug("(allowAccess) -- removing class \"access-disallowed\"");
        domSelectedExtension.classList.remove("access-disallowed");
      } else {
        this.debug("(allowAccess) -- adding class \"access-disallowed\"");
        domSelectedExtension.classList.add("access-disallowed");
      }
    }

    this.debug("-- end");
  }




  // Something on the Page was clicked.
  //
  // Check to see if an Action button was clicked - refesh, allow/disallow all, allow/disallow selected, add, remove selected, etc
  // or a label was clicked, so check it has a for="" attribute,
  // or the extension settings title was clicked
  //
  // NOTE: This listener is set on the DOCUMENT!!!
  async actionClicked(e) {
    this.debug('--');
    if (e === null) return;

    this.resetErrors();

    this.debug(`-- tagName="${e.target.tagName}" id="${e.target.id}"`);

    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'LABEL') {
      this.debug(`-- BUTTON OR LABEL CLICKED tagName="${e.target.tagName}" id="${e.target.id}"`);

      // I thought the browser was supposed to take care of this <label> with a "for" attribute stuff...
      if (e.target.tagName === 'LABEL' && (! e.target.parentElement || e.target.parentElement.tagName !== 'BUTTON')) {
        // ignore it - let optionChanged() handle it
        this.debug(`-- LABEL CLICKED, but it has no parentElement or its parentElement is not a BUTTON `);
      } else {
        e.preventDefault();

        var button;
        if (e.target.tagName === 'LABEL') {
          button = e.target.parentElement;
        } else {
          button = e.target;
        }
        this.debug(`-- BUTTON CLICKED tagName="${button.tagName}" id="${button.id}"`);

        const buttonId = button.id;
        if (buttonId) switch (buttonId) {
          case "fsbRefreshListButton":
            await this.refreshUI(e);
            break;
          case "fsbAllowAllButton":
            await this.allowAccessAllExtensions(e);
            break;
          case "fsbDisallowAllButton":
            await this.disallowAccessAllExtensions(e);
            break;
          case "fsbAllowSelectedButton":
            await this.allowAccessSelectedExtensions(e);
            break;
          case "fsbDisallowSelectedButton":
            await this.disallowAccessSelectedExtensions(e);
            break;
          case "fsbAddNewExtensionButton":
            await this.addNewExtension(e);
            break;
          case "fsbAddInstalledExtensionsButton":
            await this.selectAndAddInstalledExtensions(e);
            break;
          case "fsbShowBackupManagerButton":
            await this.showBackupManager(e);
            break;
          case "fsbShowEventLogManagerButton":
            await this.showEventLogManager(e);
            break;
          case "fsbShowStatsManagerButton":
            await this.showStatsManager(e);
            break;
          case "fsbDeleteSelectedButton":
            await this.removeSelectedExtensions(e);
            break;
          default:
            this.debug(`-- NOT OUR BUTTON -- tagName="${e.target.tagName}" id="${e.target.id}"`);
        }
      }
    } else if (e.target.tagName === "DIV") {
      this.debug(`-- DIV CLICKED id="${e.target.id}"`);

      const divId = e.target.id;
      if (divId === "fsbExtensionOptionsTitle") {
        await this.extensionOptionsTitleDivClicked(e);
      }
    } else {
      // otherwise we don't care about this click
    }
  }



  async extensionOptionsTitleDivClicked(e) {
    this.resetErrors();

    this.extensionOptionsTitleClickTimeout = setTimeout(() => this.extensionOptionsTitleDivSingleClicked(e), this.EXTENSION_OPTIONS_TITLE_CLICK_DELAY);
  }

  // Should be called ONLY when the this.extensionOptionsTitleClickTimeout has timed out
  async extensionOptionsTitleDivSingleClicked(e) {
    if (this.extensionOptionsTitleClickTimeout) {
      const timeout = this.extensionOptionsTitleClickTimeout;
      this.extensionsOptionTitleClickTimeout = null;
      clearTimeout(timeout);
    }

    if (! e) return;

    // nothing to do - we care only about the double-click
  }

  async extensionOptionsTitleDivDoubleClicked(e) {
    if (! e) return;

    this.resetErrors();

    if (e.target.tagName === "DIV") {
      const divId = e.target.id;

      if (divId === "fsbExtensionOptionsTitle") {
        if (this.extensionOptionsTitleClickTimeout) {
          const timeout = this.extensionOptionsTitleClickTimeout;
          this.extensionsOptionTitleClickTimeout = null;
          clearTimeout(timeout);
        }

        const isEnabledShowDeveloperOptions = await this.fsbOptionsApi.isEnabledOption("fsbShowDeveloperOptions");
        this.debug(`-- Extension Options DIV Double-Clicked isEnabledShowDeveloperOptions=${isEnabledShowDeveloperOptions}`);

        if (isEnabledShowDeveloperOptions) {
          // Developer Options ARE currently displayed, so remove them
          this.removeDeveloperOptions();
        } else {
          // Developer Options are NOT currently displayed, so add them
          await this.addDeveloperOptions();
        }

        await this.fsbOptionsApi.saveOption("fsbShowDeveloperOptions", ! isEnabledShowDeveloperOptions); // flip the option
      }
    }
  }



  async resetOptionsButtonClicked(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    this.resetErrors();

    this.debug("-- start");

    await this.fsbOptionsApi.resetOptions();
    await this.buildUI();

    this.debug("-- end");
  }



  async displayOptionsAsPopupButtonClicked(e) {
    e.preventDefault();

    this.resetErrors();

    this.showPopupWindow("OptionsUI");
  }



  async runSelfTestButtonClicked(e) {
    e.preventDefault();

    this.resetErrors();

    const fsbSelfTestApi  = new FileSystemBrokerSelfTests(this.logger);

    await fsbSelfTestApi.runSelfTests();
  }



  async deleteOldEventLogsButtonClicked(e) {
    e.preventDefault();

    this.resetErrors();

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
      await this.fsbEventLogger.deleteOldEventLogs(numDays);

    } else {
      this.logAlways(`-- Setting DeleteOldEventLogs timeout for ${numMinutes} minutes and ${numSeconds} seconds -- ${delayMS} ms`);
      this.devDeleteOldEventLogsTimeout = setTimeout( () => this.devDeleteOldEventLogsTimeoutTimedOut(delayMS, numDays), delayMS);
    }
  }

  async devDeleteOldEventLogsTimeoutTimedOut(delayMS, numDays) {
    const timeout = this.devDeleteOldEventLogsTimeout;
    this.devDeleteOldEventLogsTimeout = null;
    if (timeout) {
      clearTimeout(timeout);
    }

    this.logAlways(`-- Timed out after ${delayMS} ms -- Deleting Log Files more than ${numDays} days old`);
    await this.fsbEventLogger.deleteOldEventLogs(numDays);
  }



  async removeUninstalledExtensionsButtonClicked(e) {
    e.preventDefault();

    this.resetErrors();

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
      await this.fsbOptionsApi.autoRemoveUninstalledExtensions(numDays);

    } else {
      this.logAlways(`-- Setting RemoveUninstalledExtensions timeout for ${numMinutes} minutes and ${numSeconds} seconds -- ${delayMS} ms`);
      this.devRemoveUninstalledExtensionsTimeout = setTimeout( () => this.devRemoveUninstalledExtensionsTimeoutTimedOut(delayMS, numDays), delayMS);
    }
  }

  async devRemoveUninstalledExtensionsTimeoutTimedOut(delayMS, numDays) {
    const timeout = this.devRemoveUninstalledExtensionsTimeout;
    this.devRemoveUninstalledExtensionsTimeout = null;
    if (timeout) {
      clearTimeout(timeout);
    }

    this.logAlways(`-- Timed out after ${delayMS} ms -- Removing Extensions uninstalled more than ${numDays} days ago`);
    await this.fsbOptionsApi.autoRemoveUninstalledExtensions(numDays);
  }



  async addDeveloperOptions(e) {
    this.debug("-- start");

    const fsbDeveloperOptionsDiv = document.getElementById("fsbDeveloperOptions");
    if (fsbDeveloperOptionsDiv) {
      // developer options aready there, nothing to do (restore options from backup would cause this)
    } else {
      const accessLoggingEnabled                = await this.fsbOptionsApi.isEnabledAccessLogging();
      const accessDeniedLoggingEnabled          = await this.fsbOptionsApi.isEnabledAccessDeniedLogging();
      const internalMessageLoggingEnabled       = await this.fsbOptionsApi.isEnabledInternalMessageLogging();
      const internalMessageResultLoggingEnabled = await this.fsbOptionsApi.isEnabledInternalMessageResultLogging();
      const externalMessageLoggingEnabled       = await this.fsbOptionsApi.isEnabledExternalMessageLogging();
      const externalMessageResultLoggingEnabled = await this.fsbOptionsApi.isEnabledExternalMessageResultLogging();
      const skipOnboardingEnabled               = await this.fsbOptionsApi.isEnabledSkipOnboarding();
      const showOptionsWindowOnStartupEnabled   = await this.fsbOptionsApi.isEnabledShowOptionsWindowOnStartup();

      const fsbExtensionOptionsDiv = document.getElementById("fsbExtensionOptions");

      const devloperOptionsDiv =  document.createElement("div");
        devloperOptionsDiv.setAttribute("id", "fsbDeveloperOptions");

        const titleDiv = document.createElement("div");
          const titleLabel = document.createElement("label");
            titleLabel.appendChild( document.createTextNode(this.i18n_label_dev_options_title) );
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
            const logAccessLabelText = getI18nMsg("options_fsbDevEnableAccessLoggingCheck.label");
            logAccessLabel.appendChild( document.createTextNode(this.i18n_check_dev_logAccess) );
          logAccessDiv.appendChild(logAccessLabel);
        devloperOptionsDiv.appendChild(logAccessDiv);

        const logAccessDeniedDiv = document.createElement("div");
          logAccessDeniedDiv.classList.add("option-panel");
          logAccessDeniedDiv.classList.add("dev-option-panel");
          const logAccessDeniedCheck = document.createElement("input");
            logAccessDeniedCheck.setAttribute("type", "checkbox");
            logAccessDeniedCheck.setAttribute("id", "fsbEnableAccessDeniedLogging");  // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            logAccessDeniedCheck.classList.add("fsbGeneralOption");                    // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED -------<<<<<
            logAccessDeniedCheck.checked = accessDeniedLoggingEnabled;
          logAccessDeniedDiv.appendChild(logAccessDeniedCheck);
          const logAccessDeniedLabel = document.createElement("label");
            logAccessDeniedLabel.setAttribute("for", "fsbEnableAccessDeniedLogging"); // <------- MUST MATCH OPTION NAME
            logAccessDeniedLabel.setAttribute("data-l10n-id", "options_fsbDevEnableAccessDeniedLoggingCheck.label"); // update _locales/<lang>/messages.json
            logAccessDeniedLabel.appendChild( document.createTextNode(this.i18n_check_dev_logAccessDenied) );
          logAccessDeniedDiv.appendChild(logAccessDeniedLabel);
        devloperOptionsDiv.appendChild(logAccessDeniedDiv);

        const logInternalMessageDiv = document.createElement("div");
          logInternalMessageDiv.classList.add("option-panel");
          logInternalMessageDiv.classList.add("dev-option-panel");
          const logInternalMessageCheck = document.createElement("input");
            logInternalMessageCheck.setAttribute("type", "checkbox");
            logInternalMessageCheck.setAttribute("id", "fsbEnableInternalMessageLogging");  // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            logInternalMessageCheck.classList.add("fsbGeneralOption");                    // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED -------<<<<<
            logInternalMessageCheck.checked = internalMessageLoggingEnabled;
          logInternalMessageDiv.appendChild(logInternalMessageCheck);
          const logInternalMessageLabel = document.createElement("label");
            logInternalMessageLabel.setAttribute("for", "fsbEnableInternalMessageLogging"); // <------- MUST MATCH OPTION NAME
            logInternalMessageLabel.setAttribute("data-l10n-id", "options_fsbDevEnableInternalMessageLoggingCheck.label"); // update _locales/<lang>/messages.json
            logInternalMessageLabel.appendChild( document.createTextNode(this.i18n_check_dev_logInternalMessage) );
          logInternalMessageDiv.appendChild(logInternalMessageLabel);
        devloperOptionsDiv.appendChild(logInternalMessageDiv);

        const logInternalMessageResultDiv = document.createElement("div");
          logInternalMessageResultDiv.classList.add("option-panel");
          logInternalMessageResultDiv.classList.add("dev-option-panel");
          const logInternalMessageResultCheck = document.createElement("input");
            logInternalMessageResultCheck.setAttribute("type", "checkbox");
            logInternalMessageResultCheck.setAttribute("id", "fsbEnableInternalMessageResultLogging");  // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            logInternalMessageResultCheck.classList.add("fsbGeneralOption");                    // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED -------<<<<<
            logInternalMessageResultCheck.checked = internalMessageResultLoggingEnabled;
          logInternalMessageResultDiv.appendChild(logInternalMessageResultCheck);
          const logInternalMessageResultLabel = document.createElement("label");
            logInternalMessageResultLabel.setAttribute("for", "fsbEnableInternalMessageResultLogging"); // <------- MUST MATCH OPTION NAME
            logInternalMessageResultLabel.setAttribute("data-l10n-id", "options_fsbDevEnableInternalMessageResultLoggingCheck.label"); // update _locales/<lang>/messages.json
            logInternalMessageResultLabel.appendChild( document.createTextNode(this.i18n_check_dev_logInternalMessageResult) );
          logInternalMessageResultDiv.appendChild(logInternalMessageResultLabel);
        devloperOptionsDiv.appendChild(logInternalMessageResultDiv);

        const logExternalMessageDiv = document.createElement("div");
          logExternalMessageDiv.classList.add("option-panel");
          logExternalMessageDiv.classList.add("dev-option-panel");
          const logExternalMessageCheck = document.createElement("input");
            logExternalMessageCheck.setAttribute("type", "checkbox");
            logExternalMessageCheck.setAttribute("id", "fsbEnableExternalMessageLogging");  // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            logExternalMessageCheck.classList.add("fsbGeneralOption");                    // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED -------<<<<<
            logExternalMessageCheck.checked = externalMessageLoggingEnabled;
          logExternalMessageDiv.appendChild(logExternalMessageCheck);
          const logExternalMessageLabel = document.createElement("label");
            logExternalMessageLabel.setAttribute("for", "fsbEnableExternalMessageLogging"); // <------- MUST MATCH OPTION NAME
            logExternalMessageLabel.setAttribute("data-l10n-id", "options_fsbDevEnableExternalMessageLoggingCheck.label"); // update _locales/<lang>/messages.json
            logExternalMessageLabel.appendChild( document.createTextNode(this.i18n_check_dev_logExternalMessage) );
          logExternalMessageDiv.appendChild(logExternalMessageLabel);
        devloperOptionsDiv.appendChild(logExternalMessageDiv);

        const logExternalMessageResultDiv = document.createElement("div");
          logExternalMessageResultDiv.classList.add("option-panel");
          logExternalMessageResultDiv.classList.add("dev-option-panel");
          const logExternalMessageResultCheck = document.createElement("input");
            logExternalMessageResultCheck.setAttribute("type", "checkbox");
            logExternalMessageResultCheck.setAttribute("id", "fsbEnableExternalMessageResultLogging");  // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            logExternalMessageResultCheck.classList.add("fsbGeneralOption");                    // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED -------<<<<<
            logExternalMessageResultCheck.checked = externalMessageResultLoggingEnabled;
          logExternalMessageResultDiv.appendChild(logExternalMessageResultCheck);
          const logExternalMessageResultLabel = document.createElement("label");
            logExternalMessageResultLabel.setAttribute("for", "fsbEnableExternalMessageResultLogging"); // <------- MUST MATCH OPTION NAME
            logExternalMessageResultLabel.setAttribute("data-l10n-id", "options_fsbDevEnableExternalMessageResultLoggingCheck.label"); // update _locales/<lang>/messages.json
            logExternalMessageResultLabel.appendChild( document.createTextNode(this.i18n_check_dev_logExternalMessageResult) );
          logExternalMessageResultDiv.appendChild(logExternalMessageResultLabel);
        devloperOptionsDiv.appendChild(logExternalMessageResultDiv);
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
            skipOnboardingLabel.appendChild( document.createTextNode(this.i18n_check_dev_skipOnboarding) );
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
            showOptionsWindowOnStartupLabel.appendChild( document.createTextNode(this.i18n_check_dev_showOptionsWindowOnStartup) );
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
            const showOptionsWindowOnStartupLabelText = getI18nMsg("options_fsbSkipOnboardingCheck.label");
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
            resetOptionsButton.addEventListener("click", (e) => this.resetOptionsButtonClicked(e));

            const resetOptionsButtonLabel = document.createElement("label");
              resetOptionsButtonLabel.setAttribute( "id",           "fsbResetOptionsLabel"                   );
              resetOptionsButtonLabel.setAttribute( "for",          "fsbResetOptions"                        );
              resetOptionsButtonLabel.setAttribute( "data-l10n-id", "options_fsbDevResetOptionsButton.label" );
              resetOptionsButtonLabel.appendChild( document.createTextNode(this.i18n_button_dev_resetOptions) );
            resetOptionsButton.appendChild(resetOptionsButtonLabel);
          devButtonPanel.appendChild(resetOptionsButton);

          const runFilesystemBrokerTestsButton = document.createElement("button");
            runFilesystemBrokerTestsButton.setAttribute("id", "fsbRunSelfTest");
            runFilesystemBrokerTestsButton.addEventListener("click", (e) => this.runSelfTestButtonClicked(e));

            const runFilesystemBrokerTestsButtonLabel = document.createElement("label");
              runFilesystemBrokerTestsButtonLabel.setAttribute( "id",           "fsbRunSelfTestsLabel"                );
              runFilesystemBrokerTestsButtonLabel.setAttribute( "for",          "fsbRunSelfTest"                      );
              runFilesystemBrokerTestsButtonLabel.setAttribute( "data-l10n-id", "options_fsbDevSelfTestsButton.label" );
              runFilesystemBrokerTestsButtonLabel.appendChild( document.createTextNode(this.i18n_button_dev_runSelfTest) );
            runFilesystemBrokerTestsButton.appendChild(runFilesystemBrokerTestsButtonLabel);
          devButtonPanel.appendChild(runFilesystemBrokerTestsButton);

          if (! this.windowMode) {
            const displayOptionsAsPopupButton = document.createElement("button");
              displayOptionsAsPopupButton.setAttribute("id", "fsbDisplayOptionsAsPopup");
              displayOptionsAsPopupButton.addEventListener("click", (e) => this.displayOptionsAsPopupButtonClicked(e), true); // true: capturing phase

              const displayOptionsAsPopupButtonLabel = document.createElement("label");
                displayOptionsAsPopupButtonLabel.setAttribute( "id",           "fsbDisplayOptionsAsPopupLabel"                );
                displayOptionsAsPopupButtonLabel.setAttribute( "for",          "fsbDisplayOptionsAsPopup"                     );
                displayOptionsAsPopupButtonLabel.setAttribute( "data-l10n-id", "options_fsbDisplayOptionsAsPopupButton.label" );
                displayOptionsAsPopupButtonLabel.appendChild( document.createTextNode(this.i18n_button_dev_displayOptionsAsPopup) );
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
                  deleteOldEventLogsButton.addEventListener("click", (e) => this.deleteOldEventLogsButtonClicked(e));

                  const deleteOldEventLogsButtonLabel = document.createElement("label");
                    deleteOldEventLogsButtonLabel.setAttribute( "id",           "fsbDeleteOldEventLogsButtonLabel"             );
                    deleteOldEventLogsButtonLabel.setAttribute( "for",          "fsbDeleteOldEventLogs"                        );
                    deleteOldEventLogsButtonLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsButton.label" );
                    deleteOldEventLogsButtonLabel.appendChild( document.createTextNode(this.i18n_button_dev_deleteOldEventLogs) );
                  deleteOldEventLogsButton.appendChild(deleteOldEventLogsButtonLabel);
                td.appendChild(deleteOldEventLogsButton);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "right");
                const deleteOldEventLogsOlderThanNumDaysLabel = document.createElement("label");
                  deleteOldEventLogsOlderThanNumDaysLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsOlderThanNumDaysLabel" );
                  deleteOldEventLogsOlderThanNumDaysLabel.appendChild( document.createTextNode(this.i18n_label_dev_deleteOldEventLogsOlderThanNumDaysLabel) );
                td.appendChild(deleteOldEventLogsOlderThanNumDaysLabel);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("padding", "0");
                const deleteOldEventLogsNumDaysInput = document.createElement("input");
                  deleteOldEventLogsNumDaysInput.setAttribute( "type", "number"                       );
                  deleteOldEventLogsNumDaysInput.setAttribute( "id",   "fsbDeleteOldEventLogsNumDays" );
                  deleteOldEventLogsNumDaysInput.setAttribute( "min",  1                              );
                  deleteOldEventLogsNumDaysInput.setAttribute( "max",  30                             );
                  deleteOldEventLogsNumDaysInput.classList.add("no-css");                  // Tell userContent.css NOT to change me!!!
                  deleteOldEventLogsNumDaysInput.value = 7;
                td.appendChild(deleteOldEventLogsNumDaysInput);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "left");
                const deleteOldEventLogsOlderThanDaysLabel = document.createElement("label");
                  deleteOldEventLogsOlderThanDaysLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsOlderThanDaysLabel" );
                  deleteOldEventLogsOlderThanDaysLabel.appendChild( document.createTextNode(this.i18n_label_dev_deleteOldEventLogsOlderThanDaysLabel) );
                td.appendChild(deleteOldEventLogsOlderThanDaysLabel);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty( "text-align",   "right" );
                td.style.setProperty( "padding-left", "0.5em" );
                const deleteOldEventLogsInNumMinutesLabel = document.createElement("label");
                  deleteOldEventLogsInNumMinutesLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsInNumMinutesLabel" );
                  deleteOldEventLogsInNumMinutesLabel.appendChild( document.createTextNode(this.i18n_label_dev_deleteOldEventLogsInNumMinutesLabel) );
                td.appendChild(deleteOldEventLogsInNumMinutesLabel);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("padding", "0");
                const deleteOldEventLogsNumMinutesInput = document.createElement("input");
                  deleteOldEventLogsNumMinutesInput.setAttribute( "type", "number"                          );
                  deleteOldEventLogsNumMinutesInput.setAttribute( "id",   "fsbDeleteOldEventLogsNumMinutes" );
                  deleteOldEventLogsNumMinutesInput.setAttribute( "min",  0                                 );
                  deleteOldEventLogsNumMinutesInput.setAttribute( "max",  5                                 );
                  deleteOldEventLogsNumMinutesInput.classList.add("no-css");               // Tell userContent.css NOT to change me!!!
                  deleteOldEventLogsNumMinutesInput.value = 1;
                td.appendChild(deleteOldEventLogsNumMinutesInput);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "left");
                const deleteOldEventLogsInMinutesLabel = document.createElement("label");
                  deleteOldEventLogsInMinutesLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsInMinutesLabel" );
                  deleteOldEventLogsInMinutesLabel.appendChild( document.createTextNode(this.i18n_label_dev_deleteOldEventLogsInMinutesLabel) );
                td.appendChild(deleteOldEventLogsInMinutesLabel);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty( "text-align",   "right" );
                td.style.setProperty( "padding-left", "0.5em" );
                const deleteOldEventLogsInNumSecondsLabel = document.createElement("label");
                  deleteOldEventLogsInNumSecondsLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsInNumSecondsLabel" );
                  deleteOldEventLogsInNumSecondsLabel.appendChild( document.createTextNode(this.i18n_label_dev_deleteOldEventLogsInNumSecondsLabel) );
                td.appendChild(deleteOldEventLogsInNumSecondsLabel);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("padding", "0");
                const deleteOldEventLogsNumSecondsInput = document.createElement("input");
                  deleteOldEventLogsNumSecondsInput.setAttribute( "type", "number"                          );
                  deleteOldEventLogsNumSecondsInput.setAttribute( "id",   "fsbDeleteOldEventLogsNumSeconds" );
                  deleteOldEventLogsNumSecondsInput.setAttribute( "min",  0                                 );
                  deleteOldEventLogsNumSecondsInput.setAttribute( "max",  59                                );
                  deleteOldEventLogsNumSecondsInput.classList.add("no-css");               // Tell userContent.css NOT to change me!!!
                  deleteOldEventLogsNumSecondsInput.value = 0;
                td.appendChild(deleteOldEventLogsNumSecondsInput);
              deleteOldEventLogsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "left");
                const deleteOldEventLogsInSecondsLabel = document.createElement("label");
                  deleteOldEventLogsInSecondsLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsInSecondsLabel" );
                  deleteOldEventLogsInSecondsLabel.appendChild( document.createTextNode(this.i18n_label_dev_deleteOldEventLogsInSecondsLabel) );
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
                  removeUninstalledExtensionsButton.addEventListener("click", (e) => this.removeUninstalledExtensionsButtonClicked(e));

                  const removeUninstalledExtensionsButtonLabel = document.createElement("label");
                    removeUninstalledExtensionsButtonLabel.setAttribute( "id",           "fsbRemoveUninstalledExtensionsButtonLabel"             );
                    removeUninstalledExtensionsButtonLabel.setAttribute( "for",          "fsbRemoveUninstalledExtensions"                        );
                    removeUninstalledExtensionsButtonLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveUninstalledExtensionsButton.label" );
                    removeUninstalledExtensionsButtonLabel.appendChild( document.createTextNode(this.i18n_button_dev_removeUninstalledExtensions) );
                  removeUninstalledExtensionsButton.appendChild(removeUninstalledExtensionsButtonLabel);
                td.appendChild(removeUninstalledExtensionsButton);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "right");
                const removeExtensionsUninstalledMoreThanNumDaysAgoLabel = document.createElement("label");
                  removeExtensionsUninstalledMoreThanNumDaysAgoLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveExtensionsUninstalledMoreThanNumDaysAgoLabel" );
                  removeExtensionsUninstalledMoreThanNumDaysAgoLabel.appendChild(
                    document.createTextNode(this.i18n_label_dev_removeExtensionsUninstalledMoreThanNumDaysAgoLabel)
                  );
                td.appendChild(removeExtensionsUninstalledMoreThanNumDaysAgoLabel);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("padding", "0");
                const removeUninstalledExtensionsNumDaysInput = document.createElement("input");
                  removeUninstalledExtensionsNumDaysInput.setAttribute( "type", "number"                                );
                  removeUninstalledExtensionsNumDaysInput.setAttribute( "id",   "fsbRemoveUninstalledExtensionsNumDays" );
                  removeUninstalledExtensionsNumDaysInput.setAttribute( "min",  0                                       );
                  removeUninstalledExtensionsNumDaysInput.setAttribute( "max",  30                                      );
                  removeUninstalledExtensionsNumDaysInput.classList.add("no-css");                  // Tell userContent.css NOT to change me!!!
                  removeUninstalledExtensionsNumDaysInput.value = 2;
                td.appendChild(removeUninstalledExtensionsNumDaysInput);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "left");
                const removeExtensionsUninstalledMoreThanDaysAgoLabel = document.createElement("label");
                  removeExtensionsUninstalledMoreThanDaysAgoLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveExtensionsUninstalledMoreThanDaysAgoLabel" );
                  removeExtensionsUninstalledMoreThanDaysAgoLabel.appendChild(
                    document.createTextNode(this.i18n_label_dev_removeExtensionsUninstalledMoreThanDaysAgoLabel)
                  );
                td.appendChild(removeExtensionsUninstalledMoreThanDaysAgoLabel);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty( "text-align",   "right" );
                td.style.setProperty( "padding-left", "0.5em" );
                const removeUninstalledExtensionsInNumMinutesLabel = document.createElement("label");
                  removeUninstalledExtensionsInNumMinutesLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveUninstalledExtensionsInNumMinutesLabel" );
                  removeUninstalledExtensionsInNumMinutesLabel.appendChild( document.createTextNode(this.i18n_label_dev_removeUninstalledExtensionsInNumMinutesLabel) );
                td.appendChild(removeUninstalledExtensionsInNumMinutesLabel);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("padding", "0");
                const removeUninstalledExtensionsNumMinutesInput = document.createElement("input");
                  removeUninstalledExtensionsNumMinutesInput.setAttribute( "type", "number"                                   );
                  removeUninstalledExtensionsNumMinutesInput.setAttribute( "id",   "fsbRemoveUninstalledExtensionsNumMinutes" );
                  removeUninstalledExtensionsNumMinutesInput.setAttribute( "min",  0                                          );
                  removeUninstalledExtensionsNumMinutesInput.setAttribute( "max",  5                                          );
                  removeUninstalledExtensionsNumMinutesInput.classList.add("no-css");               // Tell userContent.css NOT to change me!!!
                  removeUninstalledExtensionsNumMinutesInput.value = 1;
                td.appendChild(removeUninstalledExtensionsNumMinutesInput);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "left");
                const removeUninstalledExtensionsInMinutesLabel = document.createElement("label");
                  removeUninstalledExtensionsInMinutesLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveUninstalledExtensionsInMinutesLabel" );
                  removeUninstalledExtensionsInMinutesLabel.appendChild( document.createTextNode(this.i18n_label_dev_removeUninstalledExtensionsInMinutesLabel) );
                td.appendChild(removeUninstalledExtensionsInMinutesLabel);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty( "text-align",   "right" );
                td.style.setProperty( "padding-left", "0.5em" );
                const removeUninstalledExtensionsInNumSecondsLabel = document.createElement("label");
                  removeUninstalledExtensionsInNumSecondsLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveUninstalledExtensionsInNumSecondsLabel" );
                  removeUninstalledExtensionsInNumSecondsLabel.appendChild( document.createTextNode(this.i18n_label_dev_removeUninstalledExtensionsInNumSecondsLabel) );
                td.appendChild(removeUninstalledExtensionsInNumSecondsLabel);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("padding", "0");
                const removeUninstalledExtensionsNumSecondsInput = document.createElement("input");
                  removeUninstalledExtensionsNumSecondsInput.setAttribute( "type", "number"                                   );
                  removeUninstalledExtensionsNumSecondsInput.setAttribute( "id",   "fsbRemoveUninstalledExtensionsNumSeconds" );
                  removeUninstalledExtensionsNumSecondsInput.setAttribute( "min",  0                                          );
                  removeUninstalledExtensionsNumSecondsInput.setAttribute( "max",  59                                         );
                  removeUninstalledExtensionsNumSecondsInput.classList.add("no-css");               // Tell userContent.css NOT to change me!!!
                  removeUninstalledExtensionsNumSecondsInput.value = 0;
                td.appendChild(removeUninstalledExtensionsNumSecondsInput);
              removeUninstalledExtensionsTR.appendChild(td);

              td =  document.createElement("td");
                td.style.setProperty("text-align", "left");
                const removeUninstalledExtensionsInSecondsLabel = document.createElement("label");
                  removeUninstalledExtensionsInSecondsLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveUninstalledExtensionsInSecondsLabel" );
                  removeUninstalledExtensionsInSecondsLabel.appendChild( document.createTextNode(this.i18n_label_dev_removeUninstalledExtensionsInSecondsLabel) );
                td.appendChild(removeUninstalledExtensionsInSecondsLabel);
              removeUninstalledExtensionsTR.appendChild(td);

            devActionsTable.appendChild(removeUninstalledExtensionsTR);

          devActionsPanel.appendChild(devActionsTable);

        devloperOptionsDiv.appendChild(devActionsPanel);

      fsbExtensionOptionsDiv.appendChild(devloperOptionsDiv);
    }

    this.debug("-- end");
  }



  removeDeveloperOptions(e) {
    const devloperOptionsDiv = document.getElementById("fsbDeveloperOptions");
    if (devloperOptionsDiv) {
      devloperOptionsDiv.remove();
    }
  }



  // and extension-list-item (TR or TD) was clicked
  async extensionClicked(e) {
////e.stopPropagation();
////e.stopImmediatePropagation();

    this.debug(`-- e.target.tagName="${e.target.tagName}" e.detail=${e.detail}`);

    this.resetErrors();

    if (e.detail === 1 && (e.target.tagName === "TR" || e.target.tagName === "TD")) {
      this.debug("-- TR or TD Clicked");

      var trElement;
      if (e.target.tagName === "TR") {
        trElement = e.target;
      } else if (e.target.tagName === "TD" && e.target.parentElement && e.target.parentElement.tagName === "TR") {
        trElement = e.target.parentElement;
      }

      if (trElement) {
        const extensionListTable = document.getElementById("fsbExtensionList");
        if (extensionListTable.classList.contains("edit-mode")) {
          this.debug("-- In Edit Mode -- Extensions Selection is Disabled");
          return;
        }

        this.debug("-- Got TR");
        if (trElement.classList.contains("extension-locked")) {
          // Should not happen.  Event listener should not have been added.
          this.debug("-- Extension is LOCKED");

        } else {
          if (trElement.classList.contains("extension-list-item")) { // NOTE: not extension-edit-item
            const extensionId = trElement.getAttribute("extensionId");
            this.debug(`-- Got TR.extension-list-item extensionId=${extensionId} EXTENSION_ITEM_CLICK_DELAY=${this.EXTENSION_ITEM_CLICK_DELAY}`);

            this.extensionItemClickTimeout = setTimeout(() => this.extensionSingleClicked(e, trElement), this.EXTENSION_ITEM_CLICK_DELAY);
          }
        }
      }
    }
  }

  // Should be called ONLY when the extensionIdItemClickTimeout for an extension-list-item (TR or TD) click has timed out
  async extensionSingleClicked(e, extensionElement) {
    if (this.extensionItemClickTimeout) {
      const timeout = this.extensionItemClickTimeout;
      this.extensiontemClickTimeout = null;
      clearTimeout(timeout);
    }

    if (! e) return;

    if (extensionElement.classList.contains("extension-locked")) {
      // Should not happen.  Event listener should not have been added.
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
    if (this.getSelectedExtensionCount(e) === 0) {
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

  // and extension-list-item (TR or TD) was double-clicked
  async extensionDoubleClicked(e) {
    if (this.extensionIdItemClickTimeout) {
      const timeout = this.extensionIdItemClickTimeout;
      this.extensionIdItemClickTimeout = null;
      clearTimeout(timeout);
    }

    e.stopPropagation();
    e.stopImmediatePropagation();

    this.resetErrors();

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

        if (trElement.classList.contains("extension-locked")) {
          // Should not happen.  Event listener should not have been added.
          this.debug("-- Extension is LOCKED -- Selection is Disabled");
          return;
        }

        this.debug("-- Got TR");

        if (trElement.classList.contains("extension-list-item")) { // NOTE: not extension-edit-item
          const extensionId = trElement.getAttribute("extensionId");
          this.debug(`-- Got TR.extension-list-item extensionId=${extensionId}`);

          if (extensionId) {
            await this.editExtension(e, extensionId);
          }
        }
      }
    }
  }



  async editExtension(e, extensionId) {
    if (! extensionId) return;

    this.debug(`-- extensionId="${extensionId}"`);
    const props = await this.fsbOptionsApi.getExtensionPropsById(extensionId);

    if (! props) {
      this.error(`-- DID NOT GET EXTENSION PROPERTIES -- extensionId="${extensionId}"`);
    } else {
      this.enterEditMode(false, true, props.id, props.id, props.name, props.allowAccess);
    }
  }

  async addNewExtension(e) {
    this.debug("--");
    this.enterEditMode(true, false, undefined, '', '', false);
  }

  enterEditMode(addMode, editMode, editExtensionId, extensionId, extensionName, allowAccess) {
    this.debug( "-- begin --"
                + `\n- addMode       = ${addMode}`
                + `\n- editMode      = ${editMode}`
                + `\n- extensionId   = "${extensionId}"`
                + `\n- extensionName = "${extensionName}"`
                + `\n- allowAccess   = ${allowAccess}`
              );

    if (! (addMode || editMode)) {
      this.error("-- NEITHER addMode NOR editMode WAS SPECIFIED");
      return;
    }
    if (addMode && editMode) {
      this.error("-- BOTH addMode AND editMode WERE SPECIFIED");
      return;
    }

    const extensionListTable      = document.getElementById("fsbExtensionList");
    const extensionEditTitleTR    = document.getElementById("extension_edit_title");
    const extensionEditTitleLabel = document.getElementById("extension_edit_title_text");
    const extensionEditTR         = document.getElementById("extension_edit");
    const allowAccessCheck        = document.getElementById("extension_edit_allow_access_check");
    const extensionIdText         = document.getElementById("extension_edit_text_id");
    const extensionNameText       = document.getElementById("extension_edit_text_name");
    const extensionEditErrorTR    = document.getElementById("extension_edit_error");
    const nameErrorLabel          = document.getElementById("extension_edit_error_name");
    const idErrorLabel            = document.getElementById("extension_edit_error_id");

    extensionListTable.classList.add("edit-mode");

    extensionEditTitleTR.classList.remove('display-none'); // SHOW the Editor Title Row - turn OFF display: none

    if (addMode) {
      extensionEditTitleLabel.textContent = this.extensionListEditorTitleAddMode;
    } else if (editMode) {
      extensionEditTitleLabel.textContent = this.extensionListEditorTitleEditMode;
    } else {
      extensionEditTitleLabel.textContent = '';
    }

    extensionEditTR.classList.remove('display-none');  // SHOW the Editor Fields Row - turn OFF display: none
    allowAccessCheck.checked   = allowAccess;
    extensionIdText.value      = extensionId;
    extensionNameText.value    = extensionName;

    this.editorModeAdd         = addMode;
    this.editorModeEdit        = editMode;
    this.editorEditExtensionId = editExtensionId;

    extensionEditErrorTR.classList.add('display-none');  // HIDE the Editor Fields Error Row - turn ON display: none
    nameErrorLabel.textContent = '';
    idErrorLabel.textContent   = '';

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
    const domExtensionTRs = document.querySelectorAll("tr.extension-list-item");
    this.debug(`-- domExtensionTRs.length=${domExtensionTRs.length}`);
    for (const domExtensionTR of domExtensionTRs) {
      const extensionId = domExtensionTR.getAttribute("extensionId")

      this.debug(`-- Enabling controls for Extension: extensionId="${extensionId}"`);

      selector = `input[type='checkbox'].allow-access-check[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.debug(`-- Failed to select ALLOW ACCESS Checkbox  for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }

      selector = `button.edit-extension[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.debug(`-- Failed to select EDIT Button for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }

      selector = `button.remove-extension[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.debug(`-- Failed to select DELETE Button for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }
    }

    this.enableExtensionAccessControls(false);

    this.debug("-- end");
  }



  async removeExtension(e, extensionId) {
    if (! extensionId) return;

    this.debug(`-- extensionId="${extensionId}"`);
    const selectorTR  = `tr.extension-list-item[extensionId='${extensionId}']`;
    const extensionTR = e.target.closest(selectorTR);

    if (! extensionTR) {
      this.error(`-- Failed to get Extension container for remove: selector="${selectorTR}"`);

    } else if (extensionTR.classList.contains("extension-locked")) {
      this.error(`-- Extension is LOCKED`);

    } else {
      const extensionName = extensionTR.getAttribute("extensionName");

      const deleteExtDirs = await this.fsbOptionsApi.isEnabledOnRemoveExtensionDeleteDirectory();

      this.debug(`Removing Extension id="${extensionId}" name="${extensionName}" deleteExtDirs=${deleteExtDirs}`);

      var   extensionStats;
      const statsResponse = await this.fsbCommandsApi.extensionStats(extensionId);
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

      const confirmed = await this.#showRemoveExtensionConfirmDialog(extensionId, extensionName, extensionStats, deleteExtDirs);

      if (! confirmed) {
        this.debug(`The user has chosen NOT to continue with the removal of Extension id="${extensionId}" name="${extensionName}`);
      } else {
        this.debug(`The user has chosen to CONTINUE with the removal of Extension id="${extensionId}" name="${extensionName}`);

        // returns the props for the Extension that was removed or 'undefined' if not
        const removedExtensionProps = await this.fsbOptionsApi.removeExtension(extensionId);

        if (! removedExtensionProps) {
          this.error(`-- EXTENSION NOT REMOVED extensionId="${extensionId}"`);
          this.setErrorFor("fsbExtensionOptionsTitle", "options_message_error_extensionDeleteFailed");

        } else {
          this.debug(`-- Extension Deleted extensionId="${extensionId}" removedExtensionProps:\n`, removedExtensionProps);

          if (deleteExtDirs) {
            // this method is a shortcut to just calling fsbCommandsApi.processInternalCommand()
            // responds with { 'exists': false } if the directory does not exist
            const deleteResponse = this.fsbCommandsApi.deleteExtensionDirectory(extensionId);
            // do we care about the response?
          }

          extensionTR.remove();
        }
      }
    }
  }



  async #showRemoveExtensionConfirmDialog(extId, extName, extStats, willDeleteDir) {
    const dirStats = extStats? extStats[extId] : undefined;

    this.debugAlways( "\n--- parameters:",
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

    const bounds = await this.fsbOptionsApi.getWindowBounds("RemoveExtensionConfirmDialog"); // MABXXX PERHAPS THIS SHOULD ALWAYS BE CENTERED??????

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

    const title           = getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_title");           // "Confirm Extension Removal
    const button1MsgId    = "fsbOptions_dialog_confirmRemoveExtension_button_continue.label";
    const button2MsgId    = "fsbOptions_dialog_confirmRemoveExtension_button_cancel.label";
    const messageContinue = getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_continue"); // "Do you wish to continue?"

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

    message = getI18nMsgSubst("fsbOptions_dialog_confirmRemoveExtension_message_extId_willBeRemoved", extId);
    confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
    confirmDialogUrl += `&mw${msgNum}=${encodeURIComponent('bolder')}`

    if (dirStats) {
      message = getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_hasDirectory");
      confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
      confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
      if (dirStats.count_children === undefined || dirStats.count_children === 0) {
        message = getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_directoryIsEmpty");
        confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
      } else if (dirStats.count_children === 1) {
        message = getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_directoryHasOneItem");
        confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
      } else {
        message = getI18nMsgSubst("fsbOptions_dialog_confirmRemoveExtension_message_directoryHasNNItems", dirStats.count_children);
        confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
      }
      if (willDeleteDir) {
        message = getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_willDeleteDirectory");
        confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
        confirmDialogUrl += `&uw${ulNum}=${encodeURIComponent('bold')}`
        confirmDialogUrl += `&uc${ulNum}=${encodeURIComponent('red')}`
      } else {
        message = getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_willNotDeleteDirectory");
        confirmDialogUrl += `&u${++ulNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&ua${ulNum}=${encodeURIComponent('left')}`
      }
    } else {
      message = getI18nMsg("fsbOptions_dialog_confirmRemoveExtension_message_noDirectory");
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
    const confirmDialogWindow = await messenger.windows.create(
      {
        'url':                 confirmDialogUrl,
        'type':                "popup",
        'titlePreface':        getI18nMsg("extensionName") + " - ",
        'top':                 popupTop,
        'left':                popupLeft,
        'height':              popupHeight,
        'width':               popupWidth,
        'allowScriptsToClose': true,
      }
    );

    this.debug( "\n--- Delete Directories Confirmation Popup Window Created --",
                `\n-from ourTabId="${ourTabId}"`,
                `\n-from ourWindowId="${ourWindowId}"`,
                `\n-confirmDialogWindow.id="${confirmDialogWindow.id}"`,
                `\n-URL="${confirmDialogUrl}"`,
              );

    // Re-focus on the confirmDialog window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE #confirmDialogPrompt() ???
  //  const focusListener = async (windowId) => this.windowFocusChanged(windowId, ourTabId, ourWindowId, confirmDialogWindow.id);
    const focusListener = null;
  //  messenger.windows.onFocusChanged.addListener(focusListener);

    // ConfirmDialogResponse - expected:
    // - null     - the user closed the popup window        (set by our own windows.onRemoved listener - the defaultResponse sent to #confirmDialogPrompt)
    // - CLOSED   - the user closed the popup window        (sent by the ConfirmDialog window's window.onRemoved listener -- NOT REALLY - we use our own onRemoved listener)
    // - BUTTON_1 - the user clicked button 1               (sent by the ConfirmDialog window's button listener)
    // - BUTTON_2 - the user clicked button 2               (sent by the ConfirmDialog window's button listener)
    // - BUTTON_3 - the user clicked button 3               (sent by the ConfirmDialog window's button listener)

    const confirmDialogResponse = await this.#confirmRemoveExtensionDialogPrompt(confirmDialogWindow.id, focusListener, null);
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

          messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
  //////////messenger.windows.onFocusChanged.removeListener(focusListener);

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



  async selectAndAddInstalledExtensions(e) {
    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:"
                  + `\n- mainWindow.top=${mainWindow.top}`
                  + `\n- mainWindow.left=${mainWindow.left}`
                  + `\n- mainWindow.height=${mainWindow.height}`
                  + `\n- mainWindow.width=${mainWindow.width}`
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.fsbOptionsApi.getWindowBounds("extensionChooserWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:"
                  + `\n- bounds.top=${bounds.top}`
                  + `\n- bounds.left=${bounds.left}`
                  + `\n- bounds.width=${bounds.width}`
                  + `\n- bounds.height=${bounds.height}`
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
    const extensionChooserWindow = await messenger.windows.create(
      {
        url:                 extensionChooserUrl,
        type:                "popup",
        titlePreface:        getI18nMsg("options_fsbExtensionChooserTitle", "Installed Extensions") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "-- Installed Extensions Chooser Popup Window Created --"
                + `\n-from ourTabId="${ourTabId}"`
                + `\n-from ourWindowId="${ourWindowId}"`
                + `\n-extensionChooserWindow.id="${extensionChooserWindow.id}"`
////////////////+ `\n-URL="${extensionChooserUrl}"`
              );

    // Re-focus on the extensionChooser window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE extensionChooserPrompt() ???
    const focusListener = async (windowId) => this.windowFocusChanged(windowId, ourTabId, ourWindowId, extensionChooserWindow.id);
    messenger.windows.onFocusChanged.addListener(focusListener);

    // editorResponse - expected:
    // - null               - the user closed the popup window                 (set by our own windows.onRemoved listener - the defaultResponse sent to extensionChooserPrompt)
    // - CLOSED             - the user closed the popup window                 (sent by the ExtensionChooser window's window.onClosed listener)
    // - CANCELED           - the user clicked the Cancel button               (sent by the ExtensionChooser window's Cancel button listener)
    // - { 'ADDED': count } - Extensions added, count is how many (may be 0)   (sent by the ExtensionChooser window's Save button listener)

    const extensionChooserResponse = await this.extensionChooserPrompt(extensionChooserWindow.id, focusListener, null);
    this.debug(`-- ExtensionChooser extensionChooserResponse="${extensionChooserResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (extensionChooserResponse) {
      case 'CANCELED':
      case 'CLOSED':
      case null:
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
              await this.refreshUI(e);
            }
          }
        }
    }
  }



  async extensionChooserPrompt(extensionChooserWindowId, focusListener, defaultResponse) {
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

          messenger.runtime.onMessage.removeListener(messageListener);
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



  async showBackupManager(e) {
    e.preventDefault();

    this.debug("-- begin");

    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:"
                  + `\n- mainWindow.top=${mainWindow.top}`
                  + `\n- mainWindow.left=${mainWindow.left}`
                  + `\n- mainWindow.height=${mainWindow.height}`
                  + `\n- mainWindow.width=${mainWindow.width}`
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.fsbOptionsApi.getWindowBounds("backupManagerWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:"
                  + `\n- bounds.top=${bounds.top}`
                  + `\n- bounds.left=${bounds.left}`
                  + `\n- bounds.width=${bounds.width}`
                  + `\n- bounds.height=${bounds.height}`
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
    const backupManagerWindow = await messenger.windows.create(
      {
        url:                 backupManagerUrl,
        type:                "popup",
        titlePreface:        getI18nMsg("options_fsbOptionsTitle") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "-- Installed Backup Manager Popup Window Created --"
                + `\n-from ourTabId="${ourTabId}"`
                + `\n-from ourWindowId="${ourWindowId}"`
                + `\n-backupManagerWindow.id="${backupManagerWindow.id}"`
////////////////+ `\n-URL="${backupManagerUrl}"`
              );

    // Re-focus on the backupManager window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE backupManagerPrompt() ???
    const focusListener = async (windowId) => this.windowFocusChanged(windowId, ourTabId, ourWindowId, backupManagerWindow.id);
    messenger.windows.onFocusChanged.addListener(focusListener);

    // BackupManagerResponse - expected:
    // - null                     - the user closed the popup window               (set by our own windows.onRemoved listener - the defaultResponse sent to backupManagerPrompt)
    // - CLOSED                   - the user closed the popup window               (sent by the BackupManager window's window.onClosed listener)
    // - DONE                     - the user clicked the Done button               (sent by the BackupManager window's Done button listener)
    // - { 'RESTORED': fileName } - Options restored from file with given fileName (sent by the BackupManager window's Restore button listener)

    const backupManagerResponse = await this.backupManagerPrompt(backupManagerWindow.id, focusListener, null);
    this.debug(`-- BackupManager backupManagerResponse="${backupManagerResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (backupManagerResponse) {
      case 'DONE':
      case 'CLOSED':
      case null:
        break;

      default:
        if (! typeof (backupManagerResponse === 'object')) {
          this.error(`-- UNKNOWN BackupManager Response - NOT A KEYWORD OR OBJECT: "${backupManagerResponse}"`);

        } else {
          if (! backupManagerResponse.hasOwnProperty('RESTORED')) {
            this.error(`-- UNKNOWN BackupManager Response - Object has No 'RESTORED' Property: "${backupManagerResponse}"`);

          } else {
            const fileName = backupManagerResponse.RESTORED;
            if (typeof fileName !== 'string') {
              this.error(`-- MALFORMED BackupManager Response - Invalid 'RESTORED' Property type - expected string, got: "${typeof fileName}"`);

            } else if (fileName.length === 0) {
              this.error(`-- MALFORMED BackupManager Response - Invalid 'RESTORED' Property fileName.length=${fileName.length}`);

            } else {
              this.debug(`-- Options Restored from file "${fileName}"`);
              await this.buildUI();
            }
          }
        }
    }
  }



  async backupManagerPrompt(backupManagerWindowId, focusListener, defaultResponse) {
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

          messenger.runtime.onMessage.removeListener(messageListener);
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



  async showEventLogManager(e) {
    e.preventDefault();

    this.debug("-- begin");

    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:"
                  + `\n- mainWindow.top=${mainWindow.top}`
                  + `\n- mainWindow.left=${mainWindow.left}`
                  + `\n- mainWindow.height=${mainWindow.height}`
                  + `\n- mainWindow.width=${mainWindow.width}`
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.fsbOptionsApi.getWindowBounds("eventLogManagerWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:"
                  + `\n- bounds.top=${bounds.top}`
                  + `\n- bounds.left=${bounds.left}`
                  + `\n- bounds.width=${bounds.width}`
                  + `\n- bounds.height=${bounds.height}`
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
    const eventLogManagerWindow = await messenger.windows.create(
      {
        url:                 eventLogManagerUrl,
        type:                "popup",
        titlePreface:        getI18nMsg("options_fsbOptionsTitle") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "-- Installed Backup Manager Popup Window Created --"
                + `\n-from ourTabId="${ourTabId}"`
                + `\n-from ourWindowId="${ourWindowId}"`
                + `\n-eventLogManagerWindow.id="${eventLogManagerWindow.id}"`
////////////////+ `\n-URL="${eventLogManagerUrl}"`
              );

    // Re-focus on the eventLogManager window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE eventLogManagerPrompt() ???
    const focusListener = async (windowId) => this.windowFocusChanged(windowId, ourTabId, ourWindowId, eventLogManagerWindow.id);
    messenger.windows.onFocusChanged.addListener(focusListener);

    // EventLogManagerResponse - expected:
    // - null                     - the user closed the popup window               (set by our own windows.onRemoved listener - the defaultResponse sent to eventLogManagerPrompt)
    // - CLOSED                   - the user closed the popup window               (sent by the EventLogManager window's window.onClosed listener)
    // - DONE                     - the user clicked the Done button               (sent by the EventLogManager window's Done button listener)

    const eventLogManagerResponse = await this.eventLogManagerPrompt(eventLogManagerWindow.id, focusListener, null);
    this.debug(`-- EventLogManager eventLogManagerResponse="${eventLogManagerResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (eventLogManagerResponse) {
      case 'DONE':
      case 'CLOSED':
      case null:
        break;
      default:
    }
  }



  async eventLogManagerPrompt(eventLogManagerWindowId, focusListener, defaultResponse) {
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

          messenger.runtime.onMessage.removeListener(messageListener);
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



  async showStatsManager(e) {
    e.preventDefault();

    this.debug("-- begin");

    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:"
                  + `\n- mainWindow.top=${mainWindow.top}`
                  + `\n- mainWindow.left=${mainWindow.left}`
                  + `\n- mainWindow.height=${mainWindow.height}`
                  + `\n- mainWindow.width=${mainWindow.width}`
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.fsbOptionsApi.getWindowBounds("statsManagerWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:"
                  + `\n- bounds.top=${bounds.top}`
                  + `\n- bounds.left=${bounds.left}`
                  + `\n- bounds.width=${bounds.width}`
                  + `\n- bounds.height=${bounds.height}`
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



    const statsManagerUrl    = messenger.runtime.getURL("../statsManager/statsManager.html");
    const statsManagerWindow = await messenger.windows.create(
      {
        url:                 statsManagerUrl,
        type:                "popup",
        titlePreface:        getI18nMsg("options_fsbOptionsTitle") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "-- Stats Manager Popup Window Created --"
                + `\n-from ourTabId="${ourTabId}"`
                + `\n-from ourWindowId="${ourWindowId}"`
                + `\n-statsManagerWindow.id="${statsManagerWindow.id}"`
////////////////+ `\n-URL="${statsManagerUrl}"`
              );

    // Re-focus on the statsManager window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE statsManagerPrompt() ???
    const focusListener = async (windowId) => this.windowFocusChanged(windowId, ourTabId, ourWindowId, statsManagerWindow.id);
    messenger.windows.onFocusChanged.addListener(focusListener);

    // StatsManagerResponse - expected:
    // - null                     - the user closed the popup window               (set by our own windows.onRemoved listener - the defaultResponse sent to statsManagerPrompt)
    // - CLOSED                   - the user closed the popup window               (sent by the StatsManager window's window.onClosed listener)
    // - DONE                     - the user clicked the Done button               (sent by the StatsManager window's Done button listener)

    const statsManagerResponse = await this.statsManagerPrompt(statsManagerWindow.id, focusListener, null);
    this.debug(`-- StatsManager statsManagerResponse="${statsManagerResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (statsManagerResponse) {
      case 'DONE':
      case 'CLOSED':
      case null:
        break;
      default:
    }
  }



  async statsManagerPrompt(statsManagerWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(statsManagerWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "-- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId === statsManagerWindowId) {

          messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
          messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The StatsManager sends a message as StatsManagerResponse:
       *  - CLOSED                   - the user closed the popup window               (sent by the StatsManager window's window.onClosed listener)
       *  - DONE                     - the user clicked the Done button               (sent by the StatsManager window's Done button listener)
       * Save this StatsManagerResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab && sender.tab.windowId === statsManagerWindowId && request && request.hasOwnProperty("StatsManagerResponse")) {
          response = request.StatsManagerResponse;
        }
        return false; // we're not sending any response
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  async windowFocusChanged(windowId, creatorTabId, creatorWindowId, extensionChooserWindowId) {
    if (true) return; // this whole thing is messed up

    const lastFocusedWindow = await messenger.windows.getLastFocused();
    var   lastFocusedWindowId;
    if (lastFocusedWindow) lastFocusedWindowId = lastFocusedWindow.id;

    this.debug( "--"
                + "\n- windowId="                 + windowId
                + "\n- this.prevFocusedWindowId=" + this.prevFocusedWindowId
                + "\n- lastFocusedWindowId="      + lastFocusedWindowId
                + "\n- creatorTabId="             + creatorTabId
                + "\n- creatorWindowId="          + creatorWindowId
                + "\n- extensionChooserWindowId=" + extensionChooserWindowId
              );

    if ( windowId
         && windowId                 !== messenger.windows.WINDOW_ID_NONE
         && windowId                 !== extensionChooserWindowId
         && windowId                 === creatorWindowId
/////////&& creatorWindowId          !== lastFocusedWindowId
         && extensionChooserWindowId
/////////&& extensionChooserWindowId !== lastFocusedWindowId
         && extensionChooserWindowId !== this.prevFocusedWindowId
       )
    {
      this.debug( "-- Creator Window got focus, bring Extension Chooser Window into focus above it --"
                  + "\n- creatorTabId="             + creatorTabId
                  + "\n- creatorWindowId="          + creatorWindowId
                  + "\n- extensionChooserWindowId=" + extensionChooserWindowId
                );
      try {
        messenger.windows.update(extensionChooserWindowId, { focused: true });
      } catch (error) {
        this.caught(error, "-- PERHAPS WINDOW CLOSED???");
      }
    }

    if (windowId !== messenger.windows.WINDOW_ID_NONE) this.prevFocusedWindowId = windowId;
  }



  async addAllInstalledExtensions(e) { // MABXXX NOT USED ANYMORE
    this.debug("-- begin");

    const installedExtensions = await messenger.management.getAll();
    const allExtensionsProps  = await this.fsbOptionsApi.getExtensionsProps();

    this.debug(`-- installedExtensions.length=${installedExtensions.length} allExtensionsProps.length=${Object.keys(allExtensionsProps).length}`);

    const addedExtensionsProps = {};
    var   count           = 0;
    if (installedExtensions) {
      for (const ext of installedExtensions) {
        this.debug( "-- INSTALLED EXTENSION:"
                    + `\n- ext.id          = "${ext.id}"`
                    + `\n -ext.shortName   = "${ext.shortName}"`
                    + `\n -ext.name        = "${ext.name}"`
                    + `\n -ext.enabled     = ${ext.enabled}`
                    + `\n -ext.type        = "${ext.type}"`
                    + `\n -ext.description = "${ext.description}"`
                  );
        if (ext.type !== 'extension') {
          this.debug(`-- SKIPPING: Installed Extension is not Type 'extension' -- ext.type="${ext.type}"`);

        } else if (allExtensionsProps.hasOwnProperty(ext.id)) {
            this.debug(`-- SKIPPING: Installed Extension is ALREADY in the list -- ext.id="${ext.id}"`);

        } else {
          this.debug(`-- ADDING Installed Extension -- ext.id="${ext.id}" ext.name="${ext.name}"`);

          const props = {
            'id':          ext.id,
            'name':        ext.name,
            'allowAccess': false
          };

          addedExtensionsProps[ext.id] = props;
          allExtensionsProps[ext.id] = props;
          count++;
        }
      }

      if (count) await this.fsbOptionsApi.storeExtensionsProps(allExtensionsProps);
    }

    const addedExtensionsPropsLength = Object.keys(addedExtensionsProps).length;

    if (addedExtensionsPropsLength > 0) {
      this.debug(`-- addedExtensionsPropsLength ${addedExtensionsPropsLength} > 0 -- calling refreshUI()`);
      await this.refreshUI(e);
    }

    this.debug(`-- end -- Added Extensions: addedExtensionsPropsLength=${addedExtensionsPropsLength} - count=${count}`);
    return addedExtensionsProps;
  }



  async allowAccessAllExtensions(e) {
    this.debug("-- begin");

    const count = await this.fsbOptionsApi.allowAccessAllExtensions();

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



  async disallowAccessAllExtensions(e) {
    this.debug("-- begin");

    const count = await this.fsbOptionsApi.disallowAccessAllExtensions();

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



  async allowAccessSelectedExtensions(e) {
    this.debug("-- begin");

    const selectedExtensionIds = this.getSelectedExtensionIds();
    this.debug(`-- selectedExtensionIds.length=${selectedExtensionIds.length}`);

    const count = await this.fsbOptionsApi.allowAccessSelectedExtensions(selectedExtensionIds);

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



  async disallowAccessSelectedExtensions(e) {
    this.debug("-- begin");

    const selectedExtensionIds = this.getSelectedExtensionIds();
    this.debug(`-- selectedExtensionIds.length=${selectedExtensionIds.length}`);

    const count = await this.fsbOptionsApi.disallowAccessSelectedExtensions(selectedExtensionIds);

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



  async deleteSelectedExtensions(e) {
    this.debug("-- begin");

    const selectedExtensionIds = this.getSelectedExtensionIds();

    this.debug(`-- selectedExtensionIds.length=${selectedExtensionIds.length}`);

    const extensionIdsToRemove = [];
    for (const selectedExtId of selectedExtensionIds) {
      this.debug(`-- extensionId="${selectedExtId}"`);
      const selectorTR      = `tr.extension-list-item[extensionId='${selectedExtId}']`;
      const extensionItemTR = document.querySelector(selectorTR);

      if (! extensionItemTR) {
        this.debug(`-- FAILED TO SELECT TR "${selectorTR}"`);
      } else if (extensionItemTR.classList.contains("extension-locked")) {
        this.debug(`-- Extension is LOCKED`);
      } else {
        extensionIdsToRemove.push(selectedExtId);
        extensionItemTR.remove();
      }
    }

    this.debug(`-- extensionIdsToRemove.length=${extensionIdsToRemove.length}`);

    const deletedExtensionProps = await this.fsbOptionsApi.removeExtensions(extensionIdsToRemove, false); // ignoreLocks=false: do not delete locked extensions

    this.debug(`-- deleted from identityProps: ${deletedExtensionProps.length}`);

    const deleteExtensionDirectories = await this.fsbOptionsApi.isEnabledOnRemoveExtensionDeleteDirectory();
    if (deleteExtensionDirectories) {
      for (const extId of extensionIdsToRemove) {
        this.debug(`-- deleting extension directory, extensionId="${extId}"`);
        const result = await this.fsbCommandsApi.deleteExtensionDirectory(extId) // this method is a shortcut to just calling fsbCommandsApi.processInternalCommand();
        // do we care about the result?
      }
    }

    this.debug("-- end");
  }



  getSelectedExtensionCount(e) {
    this.debug("-- begin");

    const domSelectedExtensions = document.querySelectorAll("tr.extension-list-item.selected");
    this.debug(`-- selectedExtensions.length=${domSelectedExtensions.length}`);

    this.debug("-- end");

    return domSelectedExtensions.length;
  }

  getSelectedExtensionIds(e) {
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



  resetErrors() {
    const errorDivs = document.querySelectorAll("div.option-error");
    if (errorDivs) {
      for (const errorDiv of errorDivs) {
        errorDiv.setAttribute("error", "false");
      }
    }

    const errorLabels = document.querySelectorAll("label.option-error-text");
    if (errorLabels) {
      for (const errorLabel of errorLabels) {
        errorLabel.setAttribute("error", "false");
        errorLabel.innerText = ""; // THIS IS A HUGE LESSON:  DO NOT USE: <label/>   USE: <label></label>
      }
    }
  }

  setErrorFor(elementId, msgId) {
    if (elementId && msgId) {
      const errorDiv = document.querySelector("div.option-error[error-for='" + elementId + "']");
      if (errorDiv) {
        errorDiv.setAttribute("error", "true");
      }

      const errorLabel = document.querySelector("label.option-error-text[error-for='" + elementId + "']");
      if (errorLabel) {
        const i18nMessage = getI18nMsg(msgId);
        errorLabel.innerText = i18nMessage;
      }
    }
  }



  // open ourself as a popup window
  async showPopupWindow(requestedBy) {
    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 700;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");
    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:"
                  + `\n- mainWindow.top=${mainWindow.top}`
                  + `\n- mainWindow.left=${mainWindow.left}`
                  + `\n- mainWindow.height=${mainWindow.height}`
                  + `\n- mainWindow.width=${mainWindow.width}`
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.fsbOptionsApi.getWindowBounds("optionsWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:"
                  + `\n- bounds.top=${bounds.top}`
                  + `\n- bounds.left=${bounds.left}`
                  + `\n- bounds.width=${bounds.width}`
                  + `\n- bounds.height=${bounds.height}`
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
    // otherwise we don't want to add a window.beforeunload listener: windowUnloading()
    const optionsUrl    = messenger.runtime.getURL( "optionsUI/optionsUI.html") + "?windowMode=true" + requestedByParam;
    const optionsWindow = await messenger.windows.create(
      {
        url:                 optionsUrl,
        type:                "popup",
        titlePreface:        getI18nMsg("options_fsbOptionsTitle", "Options") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug(`-- OptionsUI Popup Window Created -- windowId="${optionsWindow.id}" URL="${optionsUrl}"`);
  }



  getScrollPosition() {
    return {
      x: window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft,
      y: window.scrollY || document.documentElement.scrollTop  || document.body.scrollTop
    };
  }

  setScrollPosition(position) {
    window.scrollTo(position.x, position.y);
  }
}



var optionsUI  = new OptionsUI();

document.addEventListener("DOMContentLoaded", (e) => optionsUI.init(e), {once: true} );
