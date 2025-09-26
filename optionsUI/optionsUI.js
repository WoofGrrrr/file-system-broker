import { FsbOptions                } from '../modules/options.js';
import { Logger                    } from '../modules/logger.js';
import { FsbEventLogger            } from '../modules/event_logger.js';
import { FileSystemBrokerSelfTests } from '../modules/selftests.js';
import { logProps, getExtensionId, getI18nMsg, parseDocumentLocation, formatMsToDateTime12HR } from '../utilities.js';


class OptionsUI {

  constructor() {
    this.className                                  = this.constructor.name;

    this.LOG                                        = false;
    this.DEBUG                                      = false;

    this.extId                                      = getExtensionId();

    this.logger                                     = new Logger();
    this.fsbOptionsApi                              = new FsbOptions(this.logger);
    this.fsbEventLogger                             = new FsbEventLogger(this.fsbOptionsApi, this.logger);
    this.fsbSelfTestApi                             = new FileSystemBrokerSelfTests(this.logger);

    this.fsbOptionsApi.setEventLogger(this.fsbEventLogger);

    this.windowMode                                 = false; // are we running in a popup window??? (from the windowMode parameter in our URL)
    this.windowModeRequestedBy                      = undefined;

    this.editorModeAdd                              = false;
    this.editorModeEdit                             = false;
    this.editorEditExtensionId                      = undefined;

    this.prevFocusedWindow                          = undefined;

    this.extensionOptionsTitleClickTimer            = null;  // for detecting single- vs double-click
    this.EXTENSION_OPTIONS_TITLE_CLICK_DELAY        = 500;   // 500ms, 1/2 second (the JavaScript runtime does not guarantee this time - it's single-threaded)

    this.extensionItemClickTimer                    = null;  // for detecting single- vs double-click
    this.EXTENSION_ITEM_CLICK_DELAY                 = 500;   // 500ms, 1/2 second (the JavaScript runtime does not guarantee this time - it's single-threaded)

    this.devDeleteOldEventLogsTimeout;
    this.devRemovedUninstalledExtensionsTimeout;

    // gather i18n messages for tooltips (and some other stuff) in the Extension List
    // - the calls to getI18nMsg for tooltips will return null - NOT the message ID - if no message is configured - just no tooltip
    this.tooltip_check_allowAccess                  = getI18nMsg( "options_check_allowAccess.tooltip",            null );
    this.tooltip_button_add                         = getI18nMsg( "options_button_addExtension.tooltip",          null );
    this.tooltip_button_edit                        = getI18nMsg( "options_button_editExtension.tooltip",         null );
    this.tooltip_button_delete                      = getI18nMsg( "options_button_deleteExtension.tooltip",       null );
    this.tooltip_button_edit_save                   = getI18nMsg( "options_fsbExtensionEditSaveButton.tooltip",   null );
    this.tooltip_button_edit_add                    = getI18nMsg( "options_fsbExtensionEditAddButton.tooltip",    null );
    this.tooltip_button_edit_cancel                 = getI18nMsg( "options_fsbExtensionEditCancelButton.tooltip", null );

    this.extensionListHeaderTextId                  = getI18nMsg("options_fsbExtensionListHeaderTextId.label");
    this.extensionListHeaderTextName                = getI18nMsg("options_fsbExtensionListHeaderTextName.label");

    this.extensionListEditorTitleAddMode            = getI18nMsg("options_fsbExtensionEditTitleAddMode");
    this.extensionListEditorTitleEditMode           = getI18nMsg("options_fsbExtensionEditTitleEditMode");
    this.extensionListEditErrorExtensionIdEmpty     = getI18nMsg("options_fsbExtensionEditErrorExtensionIdEmpty");
    this.extensionListEditErrorExtensionIdInvalid   = getI18nMsg("options_fsbExtensionEditErrorExtensionIdInvalid");
    this.extensionListEditErrorExtensionIdExists    = getI18nMsg("options_fsbExtensionEditErrorExtensionIdExists");
    this.extensionListEditErrorExtensionNameEmpty   = getI18nMsg("options_fsbExtensionEditErrorExtensionNameEmpty");
    this.extensionListEditErrorExtensionNameInvalid = getI18nMsg("options_fsbExtensionEditErrorExtensionNameInvalid");
    this.extensionListEditErrorAddFailed            = getI18nMsg("options_fsbExtensionEditErrorAddFailed");
    this.extensionListEditErrorUpdateFailed         = getI18nMsg("options_fsbExtensionEditErrorUpdateFailed");

    this.i18n_label_dev_options_title               = getI18nMsg("options_fsbDevOptionsTitle.label");
    this.i18n_check_dev_skipOnboarding              = getI18nMsg("options_fsbDevSkipOnboardingCheck.label");
    this.i18n_check_dev_showOptionsWindowOnStartup  = getI18nMsg("options_fsbDevShowOptionsWindowOnStartupCheck.label");
    this.i18n_button_dev_resetOptions               = getI18nMsg("options_fsbDevResetOptionsButton.label");
    this.i18n_button_dev_runSelfTest                = getI18nMsg("options_fsbDevSelfTestButton.label");
    this.i18n_button_dev_displayOptionsAsPopup      = getI18nMsg("options_fsbDevDisplayOptionsAsPopupButton.label");
    this.i18n_button_dev_deleteOldEventLogs         = getI18nMsg("options_fsbDevDeleteOldEventLogsButton.label");
    this.i18n_button_dev_removeUninstalledExtensions= getI18nMsg("options_fsbDevRemoveUninstalledExtensionsButton.label");
  }



  log(...info) {
    if (! this.LOG) return;
    const msg = info.shift();
    this.logger.log(this.className + "#" + msg, ...info);
  }

  logAlways(...info) {
    const msg = info.shift();
    this.logger.logAlways(this.className + "#" + msg, ...info);
  }

  debug(...info) {
    if (! this.DEBUG) return;
    const msg = info.shift();
    this.logger.debug(this.className + "#" + msg, ...info);
  }

  debugAlways(...info) {
    const msg = info.shift();
    this.logger.debugAlways(this.className + "#" + msg, ...info);
  }

  error(...info) {
    // always log errors
    const msg = info.shift();
    this.logger.error(this.className + "#" + msg, ...info);
  }

  caught(e, ...info) {
    // always log exceptions
    const msg = info.shift();
    this.logger.error( this.className + "#" + msg,
                       "\n name:    " + e.name,
                       "\n message: " + e.message,
                       "\n stack:   " + e.stack,
                       ...info
                     );
  }



  async init(e) {
    this.debug("init -- begin");

    const docLocationInfo = parseDocumentLocation(document);
    const params          = docLocationInfo.params;
    if (params) {
      const windowMode = params.get('windowMode');
      this.debug(`init -- windowMode="${windowMode}"`);

      this.windowMode = (windowMode === 'true') ? true : false;

      if (this.windowMode) {
        const requestedBy = params.get('requestedBy');
        this.debug(`init -- windowMode requestedBy="${requestedBy}"`);
        if ((typeof requestedBy === 'string') && requestedBy.length > 0) {
          this.windowModeRequestedBy = requestedBy;
        }
      }
    }

    await this.localizePage();
    await this.applyTooltips(document);
    await this.buildUI();
    await this.setupListeners();

    this.debug("init -- end");
  }



  async windowUnloading(e) {
    if (this.DEBUG) this.debugAlways( "windowUnloading --- WINDOW UNLOADING ---"
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
          this.debugAlways("windowUnloading --- WINDOW UNLOADING --- Retrieve Stored Window Bounds - FAILED TO GET bounds ---");
        } else if (typeof bounds !== 'object') {
          this.debugAlways(`windowUnloading --- WINDOW UNLOADING --- Retrieve Stored Window Bounds - bounds IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
        } else {
          this.debugAlways( "windowUnloading --- Retrieve Stored Window Bounds ---"
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
    this.debug("localizePage -- start");

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

    this.debug("localizePage -- end");
  }



  async applyTooltips(theDocument) { // we could move this to utilities.js
    this.debug("applyTooltips -- start");

    for (const el of theDocument.querySelectorAll("[tooltip-l10n-id]")) {
      const id = el.getAttribute("tooltip-l10n-id");
      const i18nMessage = getI18nMsg(id);
      el.setAttribute("title", i18nMessage);
    }

    this.debug("applyTooltips -- end");
  }



  async setupListeners() {
    this.debug(`setupListeners -- start -- windowMode=${this.windowMode}`);

    document.addEventListener( "change", (e) => this.optionChanged(e) );   // One of the checkboxes or radio buttons was clicked or a select has changed
    document.addEventListener( "click",  (e) => this.actionClicked(e) );   // An Actions button was clicked (or a label, since <label for="xx"> does not work)

    const extensionOptionsTitleDiv = document.querySelector("#fsbExtensionOptionsTitle");
    if (extensionOptionsTitleDiv) {
      document.addEventListener( "dblclick",  (e) => this.extensionOptionsTitleDivDoubleClicked(e) );
    }

    if (this.windowMode) {
      this.debug("setupListeners -- Adding beforeunload Window Event Listener");
      window.addEventListener("beforeunload", (e) => this.windowUnloading(e));
    }

    this.debug("setupListeners -- end");
  }



  async buildUI() {
    this.debug("buildUI -- start");

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

    this.debug("buildUI -- end");
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
    this.debug("refreshUI -- start");

    await this.buildExtensionsListUI(e);
    this.enableExtensionAccessControls(true);

    this.debug("refreshUI -- end");
  }

  enableExtensionAccessControls(enable) {
    this.debug(`enableExtensionAccessControls -- start -- enable=${enable}`);

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

    this.debug("enableExtensionAccessControls -- end");
  }



  async updateOptionsUI() {
    this.debug("updateOptionsUI -- start");

    const options = await this.fsbOptionsApi.getAllOptions();

    this.debug("updateOptionsUI -- sync options to UI");
    for (const [optionName, optionValue] of Object.entries(options)) {
      this.debug("updateOptionsUI -- option: ", optionName, "value: ", optionValue);

      if (optionName in this.fsbOptionsApi.defaultOptionValues) {
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

    this.debug("updateOptionsUI -- end");
  }



  async buildExtensionsListUI(e) { // the event is not used - is it even useful?
    this.debug("buildExtensionsListUI -- start");

    this.resetErrors();

    const domFsbExtensionList = document.getElementById("fsbExtensionList");
    if (! domFsbExtensionList) {
      this.error("buildExtensionsListUI -- Failed to find #fsbExtensionList");
      this.setErrorFor("fsbExtensionOptionsTitle", "options_message_error_noExtensionList");
      return;
    }

    // Empty the any current Extension IDs List and add the "Loading Extension IDs List" DIV
    domFsbExtensionList.innerHTML = '';
    const i18nMessage = getI18nMsg("options_fsbExtensionsLoadingMessage", "...");
    const loadingDiv = document.createElement("tr");
    loadingDiv.classList.add("extension-loading");
    loadingDiv.appendChild(document.createTextNode(i18nMessage));
    domFsbExtensionList.appendChild(loadingDiv);

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
      this.logAlways(`buildExtensionsListUI -- typeof allExtensionsProps='${typeof allExtensionsProps}'`);
      logProps("", "buildExtensionsListUI.allExtensionsProps", allExtensionsProps);
    }

    if (typeof allExtensionsProps !== 'object') {
      this.error("buildExtensionsListUI -- allExtensionsProps is NOT an object");

    } else {
      if (this.DEBUG) {
        this.debugAlways("buildExtensionsListUI -- Extension Props, length=" + Object.entries(allExtensionsProps).length);
        logProps("", "buildExtensionsListUI.Extension Props", allExtensionsProps);
      }

      for (const [extensionId, extensionProps] of Object.entries(allExtensionsProps)) {
        this.debug(`buildExtensionsListUI -- adding Extension -- extensionId="${extensionId}"`);

        const extensionListItemUI = this.buildExtensionListItemUI(extensionId, extensionProps);
        domFsbExtensionList.appendChild(extensionListItemUI);

        this.debug(`buildExtensionsListUI -- finished adding Extension -- extensionId="${extensionId}"`);
      }
    }

    this.debug("buildExtensionsListUI -- end");
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

      const extensionNameTH = document.createElement("th");
        extensionNameTH.classList.add("extension-head-data");            // extension-head-item > extension-head-data
        const extensionNameLabel = document.createElement("label");
          extensionNameLabel.appendChild(document.createTextNode(this.extensionListHeaderTextName));
        extensionNameTH.appendChild(extensionNameLabel);
      thead.appendChild(extensionNameTH);

      const extensionIdTH = document.createElement("th");
        extensionIdTH.classList.add("extension-head-data");              // extension-head-item > extension-head-data
        const extensionIdLabel = document.createElement("label");
          extensionIdLabel.appendChild(document.createTextNode(this.extensionListHeaderTextId));
        extensionIdTH.appendChild(extensionIdLabel);
      thead.appendChild(extensionIdTH);

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
//          deleteButton.classList.add("delete-extension");         // extension-head-item > extension-head-controls-right > extension-edit-controls > delete-extension
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

      // Create Extension Title Text element and add it to the row
      const extensionTitleTextTD = document.createElement("td");
        extensionTitleTextTD.setAttribute("colspan", "3");
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

      // Create Extension Name element and add it to the row
      const extensionNameTD = document.createElement("td");
        extensionNameTD.classList.add("extension-edit-data");                 // extension-edit-item > extension-edit-data
        const extensionNameText = document.createElement("input");
          extensionNameText.setAttribute("type", "text");
          extensionNameText.setAttribute("id", "extension_edit_text_name");   // extension-edit-item > extension-edit-data > #extension_edit_text_name
          extensionNameText.classList.add("extension-edit-text");             // extension-edit-item > extension-edit-data > extension-edit-text
          extensionNameText.classList.add("no-css");                          // Do not change me, userContent.css !!!
        extensionNameTD.appendChild(extensionNameText);
      extensionEditTR.appendChild(extensionNameTD);

      // Create Extension Id element and add it to the row
      const extensionIdTD = document.createElement("td");
        extensionIdTD.classList.add("extension-edit-data");                   // extension-edit-item > extension-edit-data
        const extensionIdText = document.createElement("input");
          extensionIdText.setAttribute("type", "text");
          extensionIdText.setAttribute("id", "extension_edit_text_id");       // extension-edit-item > extension-edit-data > #extension_edit_text_id
          extensionIdText.classList.add("extension-edit-text");               // extension-edit-item > extension-edit-data > extension-edit-text
          extensionIdText.classList.add("no-css");                            // Do not change me, userContent.css !!!
        extensionIdTD.appendChild(extensionIdText);
      extensionEditTR.appendChild(extensionIdTD);

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
        extensionEditErrorLeftIconsTD.classList.add("extension-edit-error-left-icons");                    // extension-edit-error-item > extension-edit-error-left-icons
        const extensionErrorIconSpan = document.createElement("span");
          extensionErrorIconSpan.classList.add("extension-edit-error-icon");
          const extensionErrorIcon = document.createElement("img");
            extensionErrorIcon.setAttribute("src", "../images/icons/forbidden_16x16.png");
          extensionErrorIconSpan.appendChild(extensionErrorIcon);
        extensionEditErrorLeftIconsTD.appendChild(extensionErrorIconSpan);
      extensionEditErrorTR.appendChild(extensionEditErrorLeftIconsTD);

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

      // Create controls-right element and add it to the row
      const emptyRightTD = document.createElement("td");
        emptyRightTD.classList.add("extension-edit-error-empty");                   // extension-edit-error-item > extension-edit-error-empty
      extensionEditErrorTR.appendChild(emptyRightTD);

    return extensionEditErrorTR;
  }  



  buildExtensionListItemUI(extensionId, props) {
    const extensionIdFromProps = ( !props || typeof props.id          !== 'string'  ) ? ''    : props.id;
    const extensionName        = ( !props || typeof props.name        !== 'string'  ) ? ''    : props.name;
    const description          = ( !props || typeof props.description !== 'string'  ) ? ''    : props.description;
    const allowAccess          = ( !props || typeof props.allowAccess !== 'boolean' ) ? true  : props.allowAccess;
    const locked               = ( !props || typeof props.locked      !== 'boolean' ) ? false : props.locked;
    const disabled             = ( !props || typeof props.disabled    !== 'boolean' ) ? false : props.disabled;

    this.debug( "buildExtensionListItemUI -- BUILD LIST ITEM UI:"
                + `\n- extensionId ......... "${extensionId}"`
                + `\n- props.id ............ "${props.id}"`
                + `\n- props.name .......... "${props.name}"`
                + `\n- props.description ... "${props.description}"`
                + `\n- allowAccess ......... ${allowAccess}`
                + `\n- locked .............. ${locked}`
              );

    if (extensionIdFromProps != extensionId) {
      this.error(`buildExtensionListItemUI -- EXTENSION ID MISMATCH -- extensionId="${extensionId}" extensionIdFromProps="${extensionIdFromProps}"`);
    }

    const extensionTR = document.createElement("tr");
                         extensionTR.classList.add( "extension-list-item" );               // extension-list-item
      if (locked)        extensionTR.classList.add( "extension-locked"    );
      if (disabled)      extensionTR.classList.add( "extension-disabled"  );
      if (! allowAccess) extensionTR.classList.add( "access-disallowed"   );

                       extensionTR.setAttribute( "extensionId",   extensionId   );
                       extensionTR.setAttribute( "extensionName", extensionName );
      if (description) extensionTR.setAttribute( "title",         description   );


      if (! locked) {
        extensionTR.addEventListener("click", (e) => this.extensionClicked(e), true);          // <====== NOTE: event "capturing" phase
        extensionTR.addEventListener("dblclick", (e) => this.extensionDoubleClicked(e), true); // <====== NOTE: event "capturing" phase
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

      // Create Extension Name element and add it to the row
      const extensionNameTD = document.createElement("td");
        extensionNameTD.classList.add("extension-list-data");           // extension-list-item > extension-list-data
        extensionNameTD.classList.add("extension-list-name");           // extension-list-item > extension-list-name
        extensionNameTD.appendChild(document.createTextNode(extensionName));
      extensionTR.appendChild(extensionNameTD);

      // Create Extension Id element and add it to the row
      const extensionIdTD = document.createElement("td");
        extensionIdTD.classList.add("extension-list-data");             // extension-list-item > extension-list-data
        extensionIdTD.classList.add("extension-list-id");               // extension-list-item > extension-list-id
        extensionIdTD.appendChild(document.createTextNode(extensionId));
      extensionTR.appendChild(extensionIdTD);

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
            deleteButton.classList.add("delete-extension");         // extension-list-item > extension-list-controls-right > extension-edit-controls > delete-extension
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
    this.debug( "insertExtensionsListItemUI --"
                + `\n- extensionId="${extensionId}"`
                + `\n- extensionProps.id="${extensionProps.id}"`
                + `\n- extensionProps.name="${extensionProps.name}"`
                + `\n- extensionProps.allowAccess"${extensionProps.allowAccess}`
              );

    const extensionName = extensionProps.name;

    const domFsbExtensionList = document.getElementById("fsbExtensionList");

    const extensionTR = this.buildExtensionListItemUI(extensionId, extensionProps);

    var inserted = false;
    const domExtensionListItems = domFsbExtensionList.children;
    for (const domExtensionListItemTR of domExtensionListItems) {
      if (domExtensionListItemTR.classList.contains("extension-list-item")) {
        const domExtensionName = domExtensionListItemTR.getAttribute("extensionName");
        const compared = domExtensionName.localeCompare(extensionName, { 'sensitity': 'base' } );
        this.debug(`insertExtensionsListItemUI -- extensionName="${extensionName}" domExtensionName="${domExtensionName}" compared=${compared}`);

        if (compared >= 0) {
          this.debug(`insertExtensionsListItemUI -- INSERTING extensionName="${extensionName}" BEFORE domExtensionName="${domExtensionName}"`);
          domFsbExtensionList.insertBefore(extensionTR, domExtensionListItemTR);
          inserted = true;
          break;
        }
      }
    }

    if (! inserted) {
      this.debug(`insertExtensionsListItemUI -- Insertion point not found -- Appending to end of list --  extensionId="${extensionId}"`);
      domFsbExtensionList.appendChild(extensionTR);
    }
  }



  async updateExtensionsListItemUI(oldExtensionId, newExtensionId, extensionProps) {
    this.debug( "updateExtensionsListItemUI --"
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
      this.debug(`updateExtensionsListItemUI -- QUERY FAILED TO GET EXTENSION ITEM TR -- selector="${selectorTR}"`);

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
          this.debug(`updateExtensionsListItemUI -- QUERY FAILED TO GET EXTENSION ITEM allowAccess Check -- selector="${selectorAllowAccessCheck}"`);
        } else {
          allowAccessCheck.checked = extensionProps.allowAccess;
        }

        if (! nameTD) {
          this.debug(`updateExtensionsListItemUI -- QUERY FAILED TO GET EXTENSION ITEM Name TD -- selector="${selectorNameTD}"`);
        } else {
          nameTD.textContent = extensionProps.name;
        }

        if (! idTD) {
          this.debug(`updateExtensionsListItemUI -- QUERY FAILED TO GET EXTENSION ITEM ID TD -- selector="${selectorIdTD}"`);
        } else {
          idTD.textContent = extensionProps.id;
        }
      }
    }
  }



  // One of the Options checkboxes or radio buttons (etc) has been clicked or a select has changed
  async optionChanged(e) {
    if (e == null) return;
    this.debug(`optionChanged -- tagName="${e.target.tagName}" type="${e.target.type}" fsbGeneralOption? ${e.target.classList.contains("fsbGeneralOption")} id="${e.target.id}"`);

    this.resetErrors();

    var target = e.target;
    if ( target.tagName == "INPUT"
         && target.classList.contains("fsbGeneralOption")
         && ( target.type == "checkbox"
              || target.type == "radio"
            )
       )
    {
      const optionName  = target.id;
      const optionValue = target.checked;

      /* if it's a radio button, set the values for all the other buttons in the group to false */
      if (target.type == "radio") { // is it a radio button?
        this.debug(`optionChanged -- radio buttton selected ${optionName}=<${optionValue}> - group=${target.name}`);

        // first, set this option
        this.debug(`optionChanged -- Setting Radio Option {[${optionName}]: ${optionValue}}`);
        await this.fsbOptionsApi.storeOption(
          { [optionName]: optionValue }
        );

        // get all the elements with the same name, and if they're a radio, un-check them
        if (target.name) { /* && (optionValue == true || optionValue == 'true')) { Don't need this. Event fired *ONLY* when SELECTED, i.e. true */
          const radioGroupName = target.name;
          const radioGroup = document.querySelectorAll(`input[type="radio"][name="${radioGroupName}"]`);
          if (! radioGroup) {
            this.debug('optionChanged -- no radio group found');
          } else {
            this.debug(`optionChanged -- radio group members length=${radioGroup.length}`);
            if (radioGroup.length < 2) {
              this.debug('optionChanged -- no radio group members to reset (length < 2)');
            } else {
              for (const radio of radioGroup) {
                if (radio.id != optionName) { // don't un-check the one that fired
                  this.debug(`optionChanged -- resetting radio button {[${radio.id}]: false}`);
                  await this.fsbOptionsApi.storeOption(
                    { [radio.id]: false }
                  );
                }
              }
            }
          }
        }
      } else { // since we already tested for it, it's got to be a checkbox
        this.debug(`optionChanged -- Setting Checkbox Option {[${optionName}]: ${optionValue}}`);
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
    } else if ( target.tagName === 'SELECT'
                && target.classList.contains("fsbGeneralOption")
              )
    {
      const optionName  = target.id;
      const optionValue = target.value;

      // too bad target.value returns a string
      switch (optionName) {
        case 'fsbAutoLogPurgeDays':
          optionValue = +optionValue;
          if (Number.isNaN(optionValue)) {
            optionValue = 14; // 14 is the default
            // target.value = optionValue; ???
          }
          break;
        case 'fsbAutoRemoveUninstalledExtensionsDays':
          optionValue = +optionValue;
          if (Number.isNaN(optionValue)) {
            optionValue = 2; // 2 is the default
            // target.value = optionValue; ???
          }
          break;
      }
      this.debug(`optionChanged -- Setting Select Option {[${optionName}]: ${optionValue}}`);
      await this.fsbOptionsApi.storeOption(
        { [optionName]: optionValue }
      );
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



  // the user clicked an extension-head-button or extension-list-button or extension-edit-button: .edit-extension, .delete-extension, etc
  async extensionControlButtonClicked(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    this.resetErrors();

    this.debug("extensionControlButtonClicked -- begin");

    if (this.DEBUG) this.debugAlways( "extensionControlButtonClicked --" // don't build all this just to be denied by this.DEBUG inside this.debug()
                                      + `\n- tagName="${e.target.tagName}"`
                                      + `\n- extension-head-button?=${e.target.classList.contains("extension-head-button")}`
                                      + `\n- extension-list-button?=${e.target.classList.contains("extension-list-button")}`
                                      + `\n- extension-edit-button?=${e.target.classList.contains("extension-edit-button")}`
                                      + `\n- add-extension?=${e.target.classList.contains("add-extension")}`
                                      + `\n- edit-extension?=${e.target.classList.contains("edit-extension")}`
                                      + `\n- delete-extension?=${e.target.classList.contains("delete-extension")}`
                                      + `\n- extensionId="${e.target.getAttribute('extensionId')}"`
                                    );

    const button = e.target.closest("button");

    if (button) {
      if (button.classList.contains("extension-edit-button")) {
        const buttonId = button.getAttribute("id");
        this.debug(`extensionControlButtonClicked -- got edit button class "extension-edit-button", buttonId="${buttonId}"`); 

        switch (buttonId) {
          case "extensionEditCancelButton":
            await this.extensionEditCancelButtonClicked(e);
            break;
          case "extensionEditSaveButton":
            await this.extensionEditSaveButtonClicked(e);
            break;
          default:  
            this.debug(`extensionControlButtonClicked -- UNKNOWN extension-edit-button BUTTON --  buttonId="${buttonId}"`); 
        }    

      } else if (button.classList.contains("extension-head-button")) {
        if (button.classList.contains("add-extension")) {
          await this.addNewExtension(e);
        }

      } else if (button.classList.contains("extension-list-button")) {
        if ( button.classList.contains("edit-extension")
             || button.classList.contains("delete-extension")
           )
        {
          if (! button.hasAttribute("extensionId")) {
            this.debug("extensionControlButtonClicked -- I DIDN'T GET AN \"extensionId\" - I CAN'T DO ANYTHING!!!");

          } else {
            const extensionId = button.getAttribute("extensionId");
            const selectorTR  = `tr.extension-list-item[extensionId='${extensionId}']`;
            const extensionTR = e.target.closest(selectorTR);

            if (extensionTR.classList.contains("extension-locked"))  {
              // Should never happen - We should not have added an event listener to this TR
              this.debug(`extensionControlButtonClicked -- Extension is LOCKED: extensionId="${extensionId}"`);

            } else {
              if (button.classList.contains("edit-extension")) {
                await this.editExtension(e, extensionId);

              } else if (button.classList.contains("delete-extension")) {
                await this.deleteExtension(e, extensionId);
              }
            }
          }
        } else {
          this.debug("extensionControlButtonClicked -- NOT OUR BUTTON -- got expected class \"extension-list-button\", but noot expected button-specific class --"); 
        }
      } else {
        this.debug("extensionControlButtonClicked -- NOT OUR BUTTON -- expected class \"extension-edit-button\" or \"extension-list-button\" not found --");
      }
    } else {
      this.debug("extensionControlButtonClicked -- BUTTON NOT EXPECTED --");
    }

    this.debug("extensionControlButtonClicked -- end");
  }



  async extensionEditSaveButtonClicked(e) {
    e.preventDefault();

    this.debug( "extensionEditSaveButtonClicked --" 
                + `\n- this.editorModeAdd         = ${this.editorModeAdd}`
                + `\n- this.editorModeEdit        = ${this.editorModeEdit}`
                + `\n- this.editorEditExtensionId = "${this.editorEditExtensionId}"`
              );

    this.resetErrors();

    if (! this.editorModeAdd && ! this.editorModeEdit) {
      this.error("extensionEditSaveButtonClicked -- NEITHER editorModeAdd NO editorModeEdit IS SET!!!");
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
        this.debug("extensionEditSaveButtonClicked -- Empty Extension Name");
        nameErrorLabel.textContent = this.extensionListEditErrorExtensionNameEmpty;
        errors++;
      }

      if (! newExtensionId) {
        this.debug("extensionEditSaveButtonClicked -- Empty Extension ID");
        idErrorLabel.textContent = this.extensionListEditErrorExtensionIdEmpty;
        errors++;
      }

      if (! errors) {
        if (this.editorModeAdd) {
          // What if NEW Extension ID already exists???
          const props = await this.fsbOptionsApi.getExtensionPropsById(newExtensionId);
          if (props) {
            this.debug(`extensionEditSaveButtonClicked -- editorModeAdd -- EXTENSION ID ALREADY EXISTS newExtensionId="${newExtensionId}"`);
            idErrorLabel.textContent = this.extensionListEditErrorExtensionIdExists;
            errors++;

          } else {
            const newProps = await this.fsbOptionsApi.addOrUpdateExtension(undefined, newExtensionId, newExtensionName, newAllowAccess);

            if (! newProps) {
              this.error("extensionEditSaveButtonClicked -- editorModeAdd -- Options.addOrUpdateExtension FAILED TO RETURN NEW EXTENSION PROPERTIES");
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
              this.debug(`extensionEditSaveButtonClicked -- editorModeEdit -- EXTENSION ID ALREADY EXISTS: newExtensionId="${newExtensionId}"`);
              idErrorLabel.textContent = this.extensionListEditErrorExtensionIdExists;
              errors++;
            }
          }

          if (! errors) {
            const newProps = await this.fsbOptionsApi.addOrUpdateExtension(this.editorEditExtensionId, newExtensionId, newExtensionName, newAllowAccess);

            if (! newProps) {
              this.error("extensionEditSaveButtonClicked -- editorModeEdit -- Options.addOrUpdateExtension FAILED TO RETURN NEW EXTENSION PROPERTIES");
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

    this.debug("extensionEditCancelButtonClicked --");
    this.exitEditMode();
  }

  exitEditMode() {
    this.debug("exitEditMode -- begin");

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
      this.debug(`enterEditMode -- Failed to select ADD Extension Button, selector="${selector}"`);
    } else {
      element.disabled = false;
    }

    // ENABLE ALL THE EDIT & DELETE BUTTONS (skip any Extension that is LOCKED)
    const domExtensionTRs = document.querySelectorAll("tr.extension-list-item");
    this.debug(`exitEditMode -- domExtensionTRs.length=${domExtensionTRs.length}`);
    for (const domExtensionTR of domExtensionTRs) {

      const extensionId = domExtensionTR.getAttribute("extensionId");
      const locked      = domExtensionTR.classList.contains("extension-locked");

      if (locked) {
        this.debug(`exitEditMode -- Extension is LOCKED: extensionId="${extensionId}"`);

      } else {
        this.debug(`exitEditMode -- Enabling controls for Extension: extensionId="${extensionId}"`);

        selector = `input[type='checkbox'].allow-access-check[extensionId='${extensionId}']`;
        element = domExtensionTR.querySelector(selector);
        if (! element) {
          this.debug(`exitEditMode -- Failed to select ALLOW ACCESS Checkbox for Extension: extensionId="${extensionId}" selector="${selector}"`);
        } else {
          element.disabled = false;
        }

        selector = `button.edit-extension[extensionId='${extensionId}']`;
        element = domExtensionTR.querySelector(selector);
        if (! element) {
          this.debug(`exitEditMode -- Failed to select EDIT Button for Extension: extensionId="${extensionId}" selector="${selector}"`);
        } else {
          element.disabled = false;
        }

        selector = `button.delete-extension[extensionId='${extensionId}']`;
        element = domExtensionTR.querySelector(selector);
        if (! element) {
          this.debug(`exitEditMode -- Failed to select DELETE Button for Extension: extensionId="${extensionId}" selector="${selector}"`);
        } else {
          element.disabled = false;
        }
      }
    }

    this.enableExtensionAccessControls(true);

    this.editorModeAdd         = false;
    this.editorModeEdit        = false;
    this.editorEditExtensionId = undefined;

    this.debug("exitEditMode -- end");
  }



  // the user clicked a allowAccess checkbox for an Extension, etc
  async extensionOptionCheckClicked(e) {
    if (e == null) return;

    this.resetErrors();

    this.debug("extensionOptionCheckClicked -- begin");
    if (this.DEBUG) this.debugAlways( "extensionOptionCheckClicked --" // don't build all this just to be denied by this.DEBUG in this.debug()
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
this.debugAlways(`extensionOptionCheckClicked -- LABEL CLICKED -- id="${e.target.getAttribute('id')}" forId="${forId}" `);
      if (forId) {
        const forElement = document.getElementById(forId);
        if (forElement) {
          target = forElement
this.debugAlways(`extensionOptionCheckClicked -- LABEL CLICKED, FOR ELEMENT FOUND -- id="${target.getAttribute('id')}"`);
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
        this.error("extensionOptionCheckClicked -- I DIDN'T GET AN \"extensionId\" - I CAN'T DO ANYTHING!!!");

      } else {
        const checked     = e.target.checked;
        const extensionId = e.target.getAttribute("extensionId");
        const props       = await this.fsbOptionsApi.getExtensionPropsById(extensionId);

        if (! props) {
          this.debug(`extensionOptionCheckClicked -- PROPS NOT FOUND -- extensionId="${extensionId}"`);

        } else {
          // is it an allowAccess checkbox?
          if (e.target.classList.contains("allow-access-check")) { // extension-list-item > extension-list-controls-left > allow-access-check
            await this.allowAccessCheckboxClicked(e, extensionId, props, checked);

          } else if (e.target.classList.contains("XXX-check")) { // extension-list-item > extension-list-controls-left > XXX-check
            // Just a place-holder for future expansion
            
          } else {
            // We don't know exactly which checkbox it is!!!  The outer "if" test should have prevented this
            this.debug("extensionOptionCheckClicked -- NOT OUR CHECKBOX --");
          }
        }
      }
    } else {
      this.debug("extensionOptionCheckClicked -- NOT OUR CHECKBOX --");
    }

    this.debug("extensionOptionCheckClicked -- end");
  }



  async allowAccessCheckboxClicked(e, extensionId, props, allowAccess) {
    this.debug(`allowAccessCheckboxClicked -- OLD PROPS: props.id="${props.id}" props.name="${props.name}" allowAccess=${props.allowAccess}`);
    this.debug(`allowAccessCheckboxClicked -- NEW allowAccess=${allowAccess}`);

    this.resetErrors();

    // find the TR.extension-list-item and set the classes and/or attributes
    const extensionSelector     = `tr.extension-list-item[extensionId='${extensionId}']`
    const domSelectedExtension  = document.querySelector(extensionSelector);
    if (! domSelectedExtension) {
      this.debug(`allowAccessCheckboxClicked(allowAccess) -- DID NOT FIND OUR extension-list-item: "${extensionSelector}"`);

    } else if (domSelectedExtension.classList.contains("extension-locked")) {
      this.debug(`allowAccessCheckboxClicked -- extension is LOCKED`);

    } else {
      this.debug(`allowAccessCheckboxClicked(allowAccess) -- Found our extension-list-item: "${extensionSelector}"`);

      props['allowAccess'] = allowAccess;
      this.debug("allowAccessCheckboxClicked -- new allowAccess checkbox status: ", props);

      await this.fsbOptionsApi.storeExtensionPropsById(extensionId, props);

      if (allowAccess) {
        this.debug("allowAccessCheckboxClicked(allowAccess) -- removing class \"access-disallowed\"");
        domSelectedExtension.classList.remove("access-disallowed");
      } else {
        this.debug("allowAccessCheckboxClicked(allowAccess) -- adding class \"access-disallowed\"");
        domSelectedExtension.classList.add("access-disallowed");
      }
    }

    this.debug("allowAccessCheckboxClicked -- end");
  }




  // an Action button was clicked - refesh, allow/disallow all, allow/disallow selected, add, delete selected, etc
  // or a label was clicked, so check it has a for="" attribute,
  // or the extension settings title was clicked
  async actionClicked(e) {
    this.debug('actionClicked --');
    if (e == null) return;

    this.resetErrors();

    this.debug(`actionClicked -- tagName="${e.target.tagName}" id="${e.target.id}"`);

    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'LABEL') {
      this.debug(`actionClicked -- BUTTON OR LABEL CLICKED tagName="${e.target.tagName}" id="${e.target.id}"`);

      // I thought the browser was supposed to take care of this <label> with a "for" attribute stuff...
      if (e.target.tagName === 'LABEL' && ! e.target.parentElement || e.target.parentElement.tagName !== 'BUTTON') {
        // ignore it
      } else {
        e.preventDefault();

        var button;
        if (e.target.tagName === 'LABEL') {
          button = e.target.parentElement;
        } else {
          button = e.target;
        }
        this.debug(`actionClicked -- BUTTON CLICKED tagName="${button.tagName}" id="${button.id}"`);

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
          case "fsbDeleteSelectedButton":
            await this.deleteSelectedExtensions(e);
            break;
          default:
            this.debug(`action -- NOT OUR BUTTON -- tagName="${e.target.tagName}" id="${e.target.id}"`);
        }
      }
    } else if (e.target.tagName == "DIV") {
      this.debug(`action -- DIV CLICKED id="${e.target.id}"`);

      const divId = e.target.id;
      if (divId == "fsbExtensionOptionsTitle") {
        await this.extensionOptionsTitleDivClicked(e);
      }
    } else {
      // otherwise we don't care about this click
    }
  }



  async extensionOptionsTitleDivClicked(e) {
    this.resetErrors();

    this.extensionOptionsTitleClickTimer = setTimeout(() => this.extensionOptionsTitleDivSingleClicked(e), this.EXTENSION_OPTIONS_TITLE_CLICK_DELAY);
  }

  // Should be called ONLY when the this.extensionOptionsTitleClickTimer has timed out
  async extensionOptionsTitleDivSingleClicked(e) {
    if (this.extensionOptionsTitleClickTimer) {
      const timer = this.extensionOptionsTitleClickTimer;
      this.extensionsOptionTitleClickTimer = null;
      clearTimeout(timer);
    }

    if (! e) return;

    // nothing to do - we care only about the double-click
  }

  async extensionOptionsTitleDivDoubleClicked(e) {
    if (! e) return;

    this.resetErrors();

    if (e.target.tagName == "DIV") {
      const divId = e.target.id;

      if (divId == "fsbExtensionOptionsTitle") {
        if (this.extensionOptionsTitleClickTimer) {
          const timer = this.extensionOptionsTitleClickTimer;
          this.extensionsOptionTitleClickTimer = null;
          clearTimeout(timer);
        }

        const isEnabledShowDeveloperOptions = await this.fsbOptionsApi.isEnabledOption("fsbShowDeveloperOptions");
        this.debug(`extensionOptionsTitleDivDoubleClicked -- Extension Options DIV Double-Clicked isEnabledShowDeveloperOptions=${isEnabledShowDeveloperOptions}`);

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

    this.debug("resetOptionsButtonClicked -- start");

    await this.fsbOptionsApi.resetOptions();
    await this.buildUI();

    this.debug("resetOptionsButtonClicked -- end");
  }



  async displayOptionsAsPopupButtonClicked(e) {
    e.preventDefault();

    this.resetErrors();

    this.showPopupWindow("OptionsUI");
  }



  async runSelfTestButtonClicked(e) {
    e.preventDefault();

    this.resetErrors();

    await this.fsbSelfTestApi.runSelfTests();
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
      numMinutes = +numMinutesInput.value;
    }

    if (numMinutes == 0) {
      this.logAlways(`deleteOldEventLogsButtonClicked -- Deleting Log Files more than ${numDays} days old`);
      await this.fsbEventLogger.deleteOldEventLogs(numDays);

    } else {
      const delayMS = numMinutes * 60000; // 60000 is one minute is MS
      this.logAlways(`deleteOldEventLogsButtonClicked -- Setting timeout for ${numMinutes} minutes --  ${delayMS} ms`);
      this.devDeleteOldEventLogsTimeout = setTimeout( () => this.devDeleteOldEventLogsTimeoutTimedOut(delayMS, numDays), delayMS);
    }
  }

  async devDeleteOldEventLogsTimeoutTimedOut(delayMS, numDays) {
    const timeout = this.devDeleteOldEventLogsTimeout;
    this.devDeleteOldEventLogsTimeout = null;
    if (timeout) {
      clearTimeout(timeout);
    }

    this.logAlways(`devDeleteOldEventLogsTimeoutTimedOut -- Timed out after ${delayMS} ms -- Deleting Log Files more than ${numDays} days old`);
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

    if (numMinutes == 0) {
      this.logAlways(`removeUninstalledExtensionsButtonClicked -- Removing Extensions uninstalled more than ${numDays} days ago`);
      await this.fsbOptionsApi.autoRemoveUninstalledExtensions(numDays);

    } else {
      const delayMS = numMinutes * 60000; // 60000 is one minute is MS
      this.logAlways(`removeUninstalledExtensionsButtonClicked -- Setting timeout for ${numMinutes} minutes --  ${delayMS} ms`);
      this.devRemoveUninstalledExtensionsTimeout = setTimeout( () => this.devRemoveUninstalledExtensionsTimeoutTimedOut(delayMS, numDays), delayMS);
    }
  }

  async devRemoveUninstalledExtensionsTimeoutTimedOut(delayMS, numDays) {
    const timeout = this.devRemoveUninstalledExtensionsTimeout;
    this.devRemoveUninstalledExtensionsTimeout = null;
    if (timeout) {
      clearTimeout(timeout);
    }

    this.logAlways(`devRemoveUninstalledExtensionsTimeoutTimedOut -- Timed out after ${delayMS} ms -- Removing Extensions uninstalled more than ${numDays} days ago`);
    await this.fsbOptionsApi.autoRemoveUninstalledExtensions(numDays);
  }



  async addDeveloperOptions(e) {
    this.debug("addDeveloperOptions -- start");

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
            titleLabel.appendChild(document.createTextNode(this.i18n_label_dev_options_title));
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
            logAccessLabel.appendChild(document.createTextNode(this.i18n_check_dev_logAccess));
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
            logAccessDeniedLabel.appendChild(document.createTextNode(this.i18n_check_dev_logAccessDenied));
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
            logInternalMessageLabel.appendChild(document.createTextNode(this.i18n_check_dev_logInternalMessage));
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
            logInternalMessageResultLabel.appendChild(document.createTextNode(this.i18n_check_dev_logInternalMessageResult));
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
            logExternalMessageLabel.appendChild(document.createTextNode(this.i18n_check_dev_logExternalMessage));
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
            logExternalMessageResultLabel.appendChild(document.createTextNode(this.i18n_check_dev_logExternalMessageResult));
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
            skipOnboardingLabel.appendChild(document.createTextNode(this.i18n_check_dev_skipOnboarding));
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
            showOptionsWindowOnStartupLabel.appendChild(document.createTextNode(this.i18n_check_dev_showOptionsWindowOnStartup));
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
            showOptionsWindowOnStartupLabel.appendChild(document.createTextNode(showOptionsWindowOnStartupLabelText));
          showOptionsWindowOnStartupDiv.appendChild(showOptionsWindowOnStartupLabel);
        devloperOptionsDiv.appendChild(showOptionsWindowOnStartupDiv);
  */
        const buttonPanelDiv1 = document.createElement("div");
          buttonPanelDiv1.classList.add( "option-panel"     );
          buttonPanelDiv1.classList.add( "dev-option-panel" );
          buttonPanelDiv1.classList.add( "dev-button-panel" );
          buttonPanelDiv1.setAttribute("id", "fsbDevButtonPanel");

          const resetOptionsButton = document.createElement("button");
            resetOptionsButton.setAttribute("id", "fsbResetOptions");
            resetOptionsButton.addEventListener("click", (e) => this.resetOptionsButtonClicked(e));

            const resetOptionsButtonLabel = document.createElement("label");
              resetOptionsButtonLabel.setAttribute( "id",           "fsbResetOptionsLabel"                   );
              resetOptionsButtonLabel.setAttribute( "for",          "fsbResetOptions"                        );
              resetOptionsButtonLabel.setAttribute( "data-l10n-id", "options_fsbDevResetOptionsButton.label" );
              resetOptionsButtonLabel.appendChild(document.createTextNode(this.i18n_button_dev_resetOptions));
            resetOptionsButton.appendChild(resetOptionsButtonLabel);
          buttonPanelDiv1.appendChild(resetOptionsButton);

          const runFilesystemBrokerTestsButton = document.createElement("button");
            runFilesystemBrokerTestsButton.setAttribute("id", "fsbRunSelfTest");
            runFilesystemBrokerTestsButton.addEventListener("click", (e) => this.runSelfTestButtonClicked(e));

            const runFilesystemBrokerTestsButtonLabel = document.createElement("label");
              runFilesystemBrokerTestsButtonLabel.setAttribute( "id",           "fsbRunSelfTestsLabel"                );
              runFilesystemBrokerTestsButtonLabel.setAttribute( "for",          "fsbRunSelfTest"                      );
              runFilesystemBrokerTestsButtonLabel.setAttribute( "data-l10n-id", "options_fsbDevSelfTestsButton.label" );
              runFilesystemBrokerTestsButtonLabel.appendChild(document.createTextNode(this.i18n_button_dev_runSelfTest));
            runFilesystemBrokerTestsButton.appendChild(runFilesystemBrokerTestsButtonLabel);
          buttonPanelDiv1.appendChild(runFilesystemBrokerTestsButton);

          if (! this.windowMode) {
            const displayOptionsAsPopupButton = document.createElement("button");
              displayOptionsAsPopupButton.setAttribute("id", "fsbDisplayOptionsAsPopup");
              displayOptionsAsPopupButton.addEventListener("click", (e) => this.displayOptionsAsPopupButtonClicked(e), true); // true: capturing phase

              const displayOptionsAsPopupButtonLabel = document.createElement("label");
                displayOptionsAsPopupButtonLabel.setAttribute( "id",           "fsbDisplayOptionsAsPopupLabel"                );
                displayOptionsAsPopupButtonLabel.setAttribute( "for",          "fsbDisplayOptionsAsPopup"                     );
                displayOptionsAsPopupButtonLabel.setAttribute( "data-l10n-id", "options_fsbDisplayOptionsAsPopupButton.label" );
                displayOptionsAsPopupButtonLabel.appendChild(document.createTextNode(this.i18n_button_dev_displayOptionsAsPopup));
              displayOptionsAsPopupButton.appendChild(displayOptionsAsPopupButtonLabel);
            buttonPanelDiv1.appendChild(displayOptionsAsPopupButton);
          }

        devloperOptionsDiv.appendChild(buttonPanelDiv1);

        const buttonPanelDiv2 = document.createElement("div");
          buttonPanelDiv2.classList.add( "option-panel"     );
          buttonPanelDiv2.classList.add( "dev-option-panel" );
          buttonPanelDiv2.classList.add( "dev-button-panel" );
          buttonPanelDiv2.setAttribute("id", "fsbDevButtonPanel");
          const deleteOldEventLogsDiv = document.createElement("div");
            const deleteOldEventLogsButton = document.createElement("button");
              deleteOldEventLogsButton.setAttribute("id", "fsbDeleteOldEventLogs");
              deleteOldEventLogsButton.addEventListener("click", (e) => this.deleteOldEventLogsButtonClicked(e));

              const deleteOldEventLogsButtonLabel = document.createElement("label");
                deleteOldEventLogsButtonLabel.setAttribute( "id",           "fsbDeleteOldEventLogsLabel"                   );
                deleteOldEventLogsButtonLabel.setAttribute( "for",          "fsbDeleteOldEventLogs"                        );
                deleteOldEventLogsButtonLabel.setAttribute( "data-l10n-id", "options_fsbDevDeleteOldEventLogsButton.label" );
                deleteOldEventLogsButtonLabel.appendChild(document.createTextNode(this.i18n_button_dev_deleteOldEventLogs));
              deleteOldEventLogsButton.appendChild(deleteOldEventLogsButtonLabel);
            deleteOldEventLogsDiv.appendChild(deleteOldEventLogsButton);

            const deleteOldEventLogsNumDaysInput = document.createElement("input");
              deleteOldEventLogsNumDaysInput.setAttribute( "type", "number"                       );
              deleteOldEventLogsNumDaysInput.setAttribute( "id",   "fsbDeleteOldEventLogsNumDays" );
              deleteOldEventLogsNumDaysInput.setAttribute( "min",  1                              );
              deleteOldEventLogsNumDaysInput.setAttribute( "max",  30                             );
              deleteOldEventLogsNumDaysInput.classList.add("no-css");                  // Do not change me, userContent.css !!!
              deleteOldEventLogsNumDaysInput.value = 7;
            deleteOldEventLogsDiv.appendChild(deleteOldEventLogsNumDaysInput);

            const deleteOldEventLogsNumMinutesInput = document.createElement("input");
              deleteOldEventLogsNumMinutesInput.setAttribute( "type", "number"                          );
              deleteOldEventLogsNumMinutesInput.setAttribute( "id",   "fsbDeleteOldEventLogsNumMinutes" );
              deleteOldEventLogsNumMinutesInput.setAttribute( "min",  0                                 );
              deleteOldEventLogsNumMinutesInput.setAttribute( "max",  5                                 );
              deleteOldEventLogsNumMinutesInput.classList.add("no-css");               // Do not change me, userContent.css !!!
              deleteOldEventLogsNumMinutesInput.value = 1;
            deleteOldEventLogsDiv.appendChild(deleteOldEventLogsNumMinutesInput);
          buttonPanelDiv2.appendChild(deleteOldEventLogsDiv);

          const removeUninstalledExtensionsDiv = document.createElement("div");
            const removeUninstalledExtensionsButton = document.createElement("button");
              removeUninstalledExtensionsButton.setAttribute("id", "fsbRemoveUninstalledExtensions");
              removeUninstalledExtensionsButton.addEventListener("click", (e) => this.removeUninstalledExtensionsButtonClicked(e));

              const removeUninstalledExtensionsButtonLabel = document.createElement("label");
                removeUninstalledExtensionsButtonLabel.setAttribute( "id",           "fsbRemoveUninstalledExtensionsLabel"                   );
                removeUninstalledExtensionsButtonLabel.setAttribute( "for",          "fsbRemoveUninstalledExtensions"                        );
                removeUninstalledExtensionsButtonLabel.setAttribute( "data-l10n-id", "options_fsbDevRemoveUninstalledExtensionsButton.label" );
                removeUninstalledExtensionsButtonLabel.appendChild(document.createTextNode(this.i18n_button_dev_removeUninstalledExtensions));
              removeUninstalledExtensionsButton.appendChild(removeUninstalledExtensionsButtonLabel);
            removeUninstalledExtensionsDiv.appendChild(removeUninstalledExtensionsButton);

            const removeUninstalledExtensionsNumDaysInput = document.createElement("input");
              removeUninstalledExtensionsNumDaysInput.setAttribute( "type", "number"                                );
              removeUninstalledExtensionsNumDaysInput.setAttribute( "id",   "fsbRemoveUninstalledExtensionsNumDays" );
              removeUninstalledExtensionsNumDaysInput.setAttribute( "min",  0                                       );
              removeUninstalledExtensionsNumDaysInput.setAttribute( "max",  30                                      );
              removeUninstalledExtensionsNumDaysInput.classList.add("no-css");                  // Do not change me, userContent.css !!!
              removeUninstalledExtensionsNumDaysInput.value = 2;
            removeUninstalledExtensionsDiv.appendChild(removeUninstalledExtensionsNumDaysInput);

            const removeUninstalledExtensionsNumMinutesInput = document.createElement("input");
              removeUninstalledExtensionsNumMinutesInput.setAttribute( "type", "number"                                   );
              removeUninstalledExtensionsNumMinutesInput.setAttribute( "id",   "fsbRemoveUninstalledExtensionsNumMinutes" );
              removeUninstalledExtensionsNumMinutesInput.setAttribute( "min",  0                                          );
              removeUninstalledExtensionsNumMinutesInput.setAttribute( "max",  5                                          );
              removeUninstalledExtensionsNumMinutesInput.classList.add("no-css");               // Do not change me, userContent.css !!!
              removeUninstalledExtensionsNumMinutesInput.value = 1;
            removeUninstalledExtensionsDiv.appendChild(removeUninstalledExtensionsNumMinutesInput);
          buttonPanelDiv2.appendChild(removeUninstalledExtensionsDiv);

        devloperOptionsDiv.appendChild(buttonPanelDiv2);

      fsbExtensionOptionsDiv.appendChild(devloperOptionsDiv);
    }

    this.debug("addDeveloperOptions -- end");
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

    this.debug(`extensionClicked -- e.target.tagName="${e.target.tagName}" e.detail=${e.detail}`);

    this.resetErrors();

    if (e.detail == 1 && (e.target.tagName == "TR" || e.target.tagName == "TD")) {
      this.debug("extensionClicked -- TR or TD Clicked");

      var trElement;
      if (e.target.tagName == "TR") {
        trElement = e.target;
      } else if (e.target.tagName == "TD" && e.target.parentElement && e.target.parentElement.tagName == "TR") {
        trElement = e.target.parentElement;
      }

      if (trElement) {
        const extensionListTable = document.getElementById("fsbExtensionList");
        if (extensionListTable.classList.contains("edit-mode")) {
          this.debug("extensionClicked -- In Edit Mode -- Extensions Selection is Disabled");
          return;
        }

        this.debug("extensionClicked -- Got TR");
        if (trElement.classList.contains("extension-locked")) {
          // Should not happen.  Event listener should not have been added.
          this.debug("extensionClicked -- Extension is LOCKED");

        } else {
          if (trElement.classList.contains("extension-list-item")) { // NOTE: not extension-edit-item
            const extensionId = trElement.getAttribute("extensionId");
            this.debug(`extensionClicked -- Got TR.extension-list-item extensionId=${extensionId} EXTENSION_ITEM_CLICK_DELAY=${this.EXTENSION_ITEM_CLICK_DELAY}`);

            this.extensionItemClickTimer = setTimeout(() => this.extensionSingleClicked(e, trElement), this.EXTENSION_ITEM_CLICK_DELAY);
          }
        }
      }
    }
  }

  // Should be called ONLY when the extensionIdItemClickTimer for an extension-list-item (TR or TD) click has timed out
  async extensionSingleClicked(e, extensionElement) {
    if (this.extensionItemClickTimer) {
      const timer = this.extensionItemClickTimer;
      this.extensiontemClickTimer = null;
      clearTimeout(timer);
    }

    if (! e) return;

    if (extensionElement.classList.contains("extension-locked")) {
      // Should not happen.  Event listener should not have been added.
      this.debug("extensionSingleClicked -- Extension is LOCKED -- Selection is Disabled");
      return;
    }

    const extensionListTable = document.getElementById("fsbExtensionList");
    if (extensionListTable.classList.contains("edit-mode")) {
      this.debug("extensionSIngleClicked -- In Edit Mode -- Extensions Selection is Disabled");
      return;
    }

    const extensionId = extensionElement.getAttribute("extensionId");
    const selected    = extensionElement.classList.contains('selected');

    this.debug(`extensionSingleClicked -- Got SINGLE-CLICK ON TR: extensionId=${extensionId} selected=${selected}`);

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
    const deleteSelectedButton   = document.getElementById("fsbDeleteSelectedButton");
    if (this.getSelectedExtensionCount(e) == 0) {
      allowSelectedButton.disabled    = true;
      disallowSelectedButton.disabled = true;
      deleteSelectedButton.disabled   = true;
      allowSelectedButton.setAttribute(    "disabled", "" );
      disallowSelectedButton.setAttribute( "disabled", "" );
      deleteSelectedButton.setAttribute(   "disabled", "" );
    } else {
      allowSelectedButton.disabled    = false;
      disallowSelectedButton.disabled = false;
      deleteSelectedButton.disabled   = false;
      allowSelectedButton.removeAttribute(    "disabled" );
      disallowSelectedButton.removeAttribute( "disabled" );
      deleteSelectedButton.removeAttribute(   "disabled" );
    }
  }

  // and extension-list-item (TR or TD) was double-clicked
  async extensionDoubleClicked(e) {
    if (this.extensionIdItemClickTimer) {
      const timer = this.extensionIdItemClickTimer;
      this.extensionIdItemClickTimer = null;
      clearTimeout(timer);
    }

    e.stopPropagation();
    e.stopImmediatePropagation();

    this.resetErrors();

    this.debug(`extensionDoubleClicked -- e.target.tagName="${e.target.tagName}" e.detail=${e.detail}`);

    if (e.detail == 2 && (e.target.tagName == "TR" || e.target.tagName == "TD")) {
      this.debug("extensionDoubleClicked -- TR or TD Double-Clicked");

      var trElement;
      if (e.target.tagName == "TR") {
        trElement = e.target;
      } else if (e.target.tagName == "TD" && e.target.parentElement && e.target.parentElement.tagName == "TR") {
        trElement = e.target.parentElement;
      }

      if (trElement) { // NOTE: not extension-edit-item
        const extensionListTable = document.getElementById("fsbExtensionList");
        if (extensionListTable.classList.contains("edit-mode")) {
          this.debug("extensionDoubleClicked -- In Edit Mode -- Extensions Selection is Disabled");
          return;
        }

        if (trElement.classList.contains("extension-locked")) {
          // Should not happen.  Event listener should not have been added.
          this.debug("extensionDoubleClicked -- Extension is LOCKED -- Selection is Disabled");
          return;
        }

        this.debug("extensionDoubleClicked -- Got TR");

        if (trElement.classList.contains("extension-list-item")) { // NOTE: not extension-edit-item
          const extensionId = trElement.getAttribute("extensionId");
          this.debug(`extensionDoubleClicked -- Got TR.extension-list-item extensionId=${extensionId}`);

          if (extensionId) {
            await this.editExtension(e, extensionId);
          }
        }
      }
    }
  }



  async editExtension(e, extensionId) {
    if (! extensionId) return;

    this.debug(`editExtension -- extensionId="${extensionId}"`);
    const props = await this.fsbOptionsApi.getExtensionPropsById(extensionId);

    if (! props) {
      this.debug(`editExtension -- DID NOT GET EXTENSION PROPERTIES -- extensionId="${extensionId}"`);
    } else {
      this.enterEditMode(false, true, props.id, props.id, props.name, props.allowAccess);
    }
  }

  async addNewExtension(e) {
    this.debug("addNewExtension --");
    this.enterEditMode(true, false, undefined, '', '', false);
  }

  enterEditMode(addMode, editMode, editExtensionId, extensionId, extensionName, allowAccess) {
    this.debug( "enterEditMode -- begin --"
                + `\n- addMode       = ${addMode}`
                + `\n- editMode      = ${editMode}`
                + `\n- extensionId   = "${extensionId}"`
                + `\n- extensionName = "${extensionName}"`
                + `\n- allowAccess   = ${allowAccess}`
              );

    if (! (addMode || editMode)) {
      this.error("enterEditMode -- NEITHER addMode NOR editMode WAS SPECIFIED");
      return;
    }
    if (addMode && editMode) {
      this.error("enterEditMode -- BOTH addMode AND editMode WERE SPECIFIED");
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
      this.debug(`enterEditMode -- Failed to select ADD Extension Button, selector="${selector}"`);
    } else {
      element.disabled = true;
    }

    // DISABLE ALL THE CHECKBOXES and EDIT & DELETE BUTTONS DURING EDIT
    const domExtensionTRs = document.querySelectorAll("tr.extension-list-item");
    this.debug(`enterEditMode -- domExtensionTRs.length=${domExtensionTRs.length}`);
    for (const domExtensionTR of domExtensionTRs) {
      const extensionId = domExtensionTR.getAttribute("extensionId")

      this.debug(`enterEditMode -- Enabling controls for Extension: extensionId="${extensionId}"`);

      selector = `input[type='checkbox'].allow-access-check[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.debug(`enterEditMode -- Failed to select ALLOW ACCESS Checkbox  for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }

      selector = `button.edit-extension[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.debug(`enterEditMode -- Failed to select EDIT Button for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }

      selector = `button.delete-extension[extensionId='${extensionId}']`;
      element = domExtensionTR.querySelector(selector);
      if (! element) {
        this.debug(`enterEditMode -- Failed to select DELETE Button for Extension: extensionId="${extensionId}" selector="${selector}"`);
      } else {
        element.disabled = true;
      }
    }

    this.enableExtensionAccessControls(false);

    this.debug("enterEditMode -- end");
  }



  async deleteExtension(e, extensionId) {
    if (! extensionId) return;

    this.debug(`deleteExtension -- extensionId="${extensionId}"`);
    const selectorTR  = `tr.extension-list-item[extensionId='${extensionId}']`;
    const extensionTR = e.target.closest(selectorTR);

    if (! extensionTR) {
      this.error(`deleteExtension -- Failed to get Extension container for delete: selector="${selectorTR}"`);

    } else if (extensionTR.classList.contains("extension-locked")) {
      this.debug(`deleteExtension -- Extension is LOCKED`);

    } else {
      // returns the props for the Extension that was deleted or 'undefined' if not
      const deleted = await this.fsbOptionsApi.deleteExtension(extensionId);

      if (! deleted) {
        this.error(`deleteExtension -- EXTENSION NOT DELETED extensionId="${extensionId}"`);
        this.setErrorFor("fsbExtensionOptionsTitle", "options_message_error_extensionDeleteFailed");

      } else {
        this.debug(`deleteExtension -- Extension Deleted extensionId="${extensionId}" deleted.id="${deleted.id}"` );
        extensionTR.remove();
      }
    }
  }



  async selectAndAddInstalledExtensions(e) {
    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("selectAndAddInstalledExtensions -- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "selectAndAddInstalledExtensions -- Got the Current (Main, mail:3pane) Window:"
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
      this.debug("selectAndAddInstalledExtensions -- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`selectAndAddInstalledExtensions -- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "selectAndAddInstalledExtensions -- restoring previous window bounds:"
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
      this.debug("selectAndAddInstalledExtensions -- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`selectAndAddInstalledExtensions -- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
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

    this.debug( "selectAndAddInstalledExtensions -- Installed Extensions Chooser Popup Window Created --"
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
    this.debug(`selectAndAddInstalledExtensions -- ExtensionChooser extensionChooserResponse="${extensionChooserResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (extensionChooserResponse) {
      case 'CANCELED':
      case 'CLOSED':
      case null:
        break;

      default:
        if (! typeof (extensionChooserResponse === 'object')) {
          this.error(`selectAndAddInstalledExtensions -- UNKNOWN ExtensionChooser Response - NOT A KEYWORD OR OBJECT: "${extensionChooserResponse}"`);

        } else {
          if (! extensionChooserResponse.hasOwnProperty('ADDED')) {
            this.error(`selectAndAddInstalledExtensions -- UNKNOWN ExtensionChooser Response - Object has No 'ADDED' Property: "${extensionChooserResponse}"`);

          } else {
            const added = extensionChooserResponse.ADDED;
            if (typeof added !== 'number') {
              this.error(`selectAndAddInstalledExtensions -- MALFORMED ExtensionChooser Response - Invalid 'ADDED' Property type - expected 'number', got: '${typeof added}'`);

            } else if (added === 0) {
              this.debug("selectAndAddInstalledExtensions -- No Extensions were added");

            } else {
              this.debug(`selectAndAddInstalledExtensions -- ${added}  Extensions were added`);
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
      this.caught(error, "extensionChooserPrompt -- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId == extensionChooserWindowId) {

          messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
          messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The ExtensionChooser sends a message as ExtensionChooserResponse:
       *  - CLOSED             - the user closed the popup window                  --  Problem - message "conduit" gets destroyed before message is sent/received
       *  - CANCELED           - the user clicked the Cancel button
       *  - { 'ADDED': count } - Extensions added, count is how many (may be 0)    -- MABXXX NEED TO CHANGE { 'ADDED': 0 } to something else???
       * Save this ExtensionChooserResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab.windowId == extensionChooserWindowId && request && request.ExtensionChooserResponse) {
          response = request.ExtensionChooserResponse;
        }

        return false; // we're not sending any more messages
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  async showBackupManager(e) {
    e.preventDefault();

    this.debug("showBackupManager -- begin");

    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("showBackupManager -- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "showBackupManager -- Got the Current (Main, mail:3pane) Window:"
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
      this.debug("showBackupManager -- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`showBackupManager -- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "showBackupManager -- restoring previous window bounds:"
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
      this.debug("showBackupManager -- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`showBackupManager -- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
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

    this.debug( "showBackupManager -- Installed Backup Manager Popup Window Created --"
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
    this.debug(`showBackupManager -- BackupManager backupManagerResponse="${backupManagerResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (backupManagerResponse) {
      case 'DONE':
      case 'CLOSED':
      case null:
        break;

      default:
        if (! typeof (backupManagerResponse === 'object')) {
          this.error(`showBackupManager -- UNKNOWN BackupManager Response - NOT A KEYWORD OR OBJECT: "${backupManagerResponse}"`);

        } else {
          if (! backupManagerResponse.hasOwnProperty('RESTORED')) {
            this.error(`showBackupManager -- UNKNOWN BackupManager Response - Object has No 'RESTORED' Property: "${backupManagerResponse}"`);

          } else {
            const fileName = backupManagerResponse.RESTORED;
            if (typeof fileName !== 'string') {
              this.error(`showBackupManager -- MALFORMED BackupManager Response - Invalid 'RESTORED' Property type - expected string, got: "${typeof fileName}"`);

            } else if (fileName.length == 0) {
              this.error(`showBackupManager -- MALFORMED BackupManager Response - Invalid 'RESTORED' Property fileName.length=${fileName.length}`);

            } else {
              this.debug(`showBackupManager -- Options Restored from file "${fileName}"`);
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
      this.caught(error, "backupManagerPrompt -- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId == backupManagerWindowId) {

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
        if (sender.tab.windowId == backupManagerWindowId && request && request.BackupManagerResponse) {
          response = request.BackupManagerResponse;
        }

        return false; // we're not sending any more messages
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  async showEventLogManager(e) {
    e.preventDefault();

    this.debug("showEventLogManager -- begin");

    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("showEventLogManager -- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "showEventLogManager -- Got the Current (Main, mail:3pane) Window:"
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
      this.debug("showEventLogManager -- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`showEventLogManager -- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "showEventLogManager -- restoring previous window bounds:"
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
      this.debug("showEventLogManager -- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`showEventLogManager -- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
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

    this.debug( "showEventLogManager -- Installed Backup Manager Popup Window Created --"
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
    this.debug(`showEventLogManager -- EventLogManager eventLogManagerResponse="${eventLogManagerResponse}"`);

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
      this.caught(error, "eventLogManagerPrompt -- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId == eventLogManagerWindowId) {

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
        if (sender.tab && sender.tab.windowId == eventLogManagerWindowId && request && request.EventLogManagerResponse) {
          response = request.EventLogManagerResponse;
        }

        return false; // we're not sending any more messages
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  async windowFocusChanged(windowId, creatorTabId, creatorWindowId, extensionChooserWindowId) {
    const lastFocusedWindow = await messenger.windows.getLastFocused();
    var   lastFocusedWindowId;
    if (lastFocusedWindow) lastFocusedWindowId = lastFocusedWindow.id;

    this.debug( "windowFocusChanged --"
                + "\n- windowId="                 + windowId
                + "\n- this.prevFocusedWindowId=" + this.prevFocusedWindowId
                + "\n- lastFocusedWindowId="      + lastFocusedWindowId
                + "\n- creatorTabId="             + creatorTabId
                + "\n- creatorWindowId="          + creatorWindowId
                + "\n- extensionChooserWindowId=" + extensionChooserWindowId
              );

    if ( windowId
         && windowId                 != messenger.windows.WINDOW_ID_NONE
         && windowId                 != extensionChooserWindowId
         && windowId                 == creatorWindowId
/////////&& creatorWindowId          != lastFocusedWindowId
         && extensionChooserWindowId
/////////&& extensionChooserWindowId != lastFocusedWindowId
         && extensionChooserWindowId != this.prevFocusedWindowId
       )
    {
      this.debug( "windowFocusChanged -- Creator Window got focus, bring Extension Chooserr Window into focus above it --"
                  + "\n- creatorTabId="             + creatorTabId
                  + "\n- creatorWindowId="          + creatorWindowId
                  + "\n- extensionChooserWindowId=" + extensionChooserWindowId
                );
      try {
        messenger.windows.update(extensionChooserWindowId, { focused: true });
      } catch (error) {
        this.caught(error, "windowFocusChanged -- PERHAPS WINDOW CLOSED???");
      }
    }

    if (windowId !== messenger.windows.WINDOW_ID_NONE) this.prevFocusedWindowId = windowId;
  }



  async addAllInstalledExtensions(e) { // MABXXX NOT USED ANYMORE
    this.debug("addAllInstalledExtensions -- begin");

    const installedExtensions = await messenger.management.getAll();
    const allExtensionsProps  = await this.fsbOptionsApi.getExtensionsProps();

    this.debug(`addAllInstalledExtensions -- installedExtensions.length=${installedExtensions.length} allExtensionsProps.length=${Object.keys(allExtensionsProps).length}`);

    const addedExtensionsProps = {};
    var   count           = 0;
    if (installedExtensions) {
      for (const ext of installedExtensions) {
        this.debug( "addAllInstalledExtensions -- INSTALLED EXTENSION:"
                    + `\n- ext.id          = "${ext.id}"`
                    + `\n -ext.shortName   = "${ext.shortName}"`
                    + `\n -ext.name        = "${ext.name}"`
                    + `\n -ext.enabled     = ${ext.enabled}`
                    + `\n -ext.type        = "${ext.type}"`
                    + `\n -ext.description = "${ext.description}"`
                  );
        if (ext.type !== 'extension') {
          this.debug(`addAllInstalledExtensions -- SKIPPING: Installed Extension is not Type 'extension' -- ext.type="${ext.type}"`);

        } else if (allExtensionsProps.hasOwnProperty(ext.id)) {
            this.debug(`addAllInstalledExtensions -- SKIPPING: Installed Extension is ALREADY in the list -- ext.id="${ext.id}"`);

        } else {
          this.debug(`addAllInstalledExtensions -- ADDING Installed Extension -- ext.id="${ext.id}" ext.name="${ext.name}"`);

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
      this.debug(`addAllInstalledExtensions -- addedExtensionsPropsLength ${addedExtensionsPropsLength} > 0 -- calling refreshUI()`);
      await this.refreshUI(e);
    }

    this.debug(`addAllInstalledExtensions -- end -- Added Extensions: addedExtensionsPropsLength=${addedExtensionsPropsLength} - count=${count}`);
    return addedExtensionsProps;
  }



  async allowAccessAllExtensions(e) {
    this.debug("allowAccessAllExtensions -- begin");

    const count = await this.fsbOptionsApi.allowAccessAllExtensions();

    const domAllowAccessChecks = document.querySelectorAll("input[type='checkbox'].allow-access-check");
    this.debug(`allowAccessAllExtensions -- domAllowAccessChecks.length=${domAllowAccessChecks.length}`);
    for (const check of domAllowAccessChecks) {
      const extensionId = check.getAttribute("extensionId");

      this.debug(`allowAccessAllExtensions -- extensionId="${extensionId}" setting check=true`);
      check.checked = true;

      const selectorTR      = `tr.extension-list-item[extensionId='${extensionId}']`;
      const extensionItemTR = check.closest(selectorTR);
      if (! extensionItemTR) {
        this.debug(`allowAccessAllExtensions -- FAILED TO SELECT ANCESTOR TR "${selectorTR}"`);

      } else if (extensionItemTR.classList.contains("extension-locked")) {
        this.debug(`allowAccessAllExtensions -- Extension is LOCKED`);

      } else {
        this.debug(`allowAccessAllExtensions -- removing class "access-disallowed"`);
        extensionItemTR.classList.remove("access-disallowed");
      }
    }

    this.debug("allowAccessAllExtensions -- end");
  }



  async disallowAccessAllExtensions(e) {
    this.debug("disallowAccessAllExtensions -- begin");

    const count = await this.fsbOptionsApi.disallowAccessAllExtensions();

    const domAllowAccessChecks = document.querySelectorAll("input[type='checkbox'].allow-access-check");
    this.debug(`disallowAccessAllExtensions -- domAllowAccessChecks.length=${domAllowAccessChecks.length}`);
    for (const check of domAllowAccessChecks) {
      const extensionId = check.getAttribute("extensionId");

      this.debug(`disallowAccessAllExtensions -- extensionId="${extensionId}" setting check=false`);
      check.checked = false;

      const selectorTR      = `tr.extension-list-item[extensionId='${extensionId}']`;
      const extensionItemTR = check.closest(selectorTR);
      if (! extensionItemTR) {
        this.debug(`disallowAccessAllExtensions -- FAILED TO SELECT ANCESTOR TR "${selectorTR}"`);

      } else if (extensionItemTR.classList.contains("extension-locked")) {
        this.debug(`disallowAccessAllExtensions -- Extension is LOCKED`);

      } else {
        this.debug(`disallowAccessAllExtensions -- adding class "access-disallowed"`);
        extensionItemTR.classList.add("access-disallowed");
      }
    }

    this.debug("disallowAccessAllExtensions -- end");
  }



  async allowAccessSelectedExtensions(e) {
    this.debug("allowAccessSelectedExtensions -- begin");

    const selectedExtensionIds = this.getSelectedExtensionIds();
    this.debug(`allowAccessSelectedExtensions -- selectedExtensionIds.length=${selectedExtensionIds.length}`);

    const count = await this.fsbOptionsApi.allowAccessSelectedExtensions(selectedExtensionIds);

    for (const extensionId of selectedExtensionIds) {
      this.debug(`allowAccessSelectedExtensions -- extensionId="${extensionId}" setting check=true`);
      const checkSelector = `input.allow-access-check[type='checkbox'][extensionId='${extensionId}']`;
      const check         = document.querySelector(checkSelector);

      if (! check) {
        this.debug(`allowAccessSelectedExtensions -- FAILED TO SELECT CHECK "${checkSelector}"`);

      } else {
        check.checked = true;

        const selectorTR      = `tr.extension-list-item[extensionId='${extensionId}']`;
        const extensionItemTR = check.closest(selectorTR);
        if (! extensionItemTR) {
          this.debug(`allowAccessSelectedExtensions -- FAILED TO SELECT ANCESTOR TR "${selectorTR}"`);

        } else if (extensionItemTR.classList.contains("extension-locked")) {
          this.debug(`allowAccessSelectedExtensions -- Extension is LOCKED`);

        } else {
          this.debug(`allowAccessSelectedExtensions -- Removing class "access-disallowed"`);
          extensionItemTR.classList.remove("access-disallowed");
        }
      }
    }

    this.debug("allowAccessSelectedExtensions -- end");
  }



  async disallowAccessSelectedExtensions(e) {
    this.debug("disallowAccessSelectedExtensions -- begin");

    const selectedExtensionIds = this.getSelectedExtensionIds();
    this.debug(`disallowAccessSelectedExtensions -- selectedExtensionIds.length=${selectedExtensionIds.length}`);

    const count = await this.fsbOptionsApi.disallowAccessSelectedExtensions(selectedExtensionIds);

    for (const extensionId of selectedExtensionIds) {
      this.debug(`disallowAccessSelectedExtensions -- extensionId="${extensionId}" setting check=false`);
      const checkSelector = `input.allow-access-check[type='checkbox'][extensionId='${extensionId}']`;
      const check         = document.querySelector(checkSelector);

      if (! check) {
        this.debug(`disallowAccessSelectedExtensions -- FAILED TO SELECT CHECK "${checkSelector}"`);

      } else {
        check.checked = false;

        const selectorTR      = `tr.extension-list-item[extensionId='${extensionId}']`;
        const extensionItemTR = check.closest(selectorTR);
        if (! extensionItemTR) {
          this.debug(`disallowAccessSelectedExtensions -- FAILED TO SELECT ANCESTOR TR "${selectorTR}"`);

        } else if (extensionItemTR.classList.contains("extension-locked")) {
          this.debug(`disallowAccessSelectedExtensions -- Extension is LOCKED`);

        } else {
          this.debug(`disallowAccessSelectedExtensions -- Adding class "access-disallowed"`);
          extensionItemTR.classList.add("access-disallowed");
        }
      }
    }

    this.debug("disallowAccessSelectedExtensions -- end");
  }



  async deleteSelectedExtensions(e) {
    this.debug("deleteSelectedExtensions -- begin");

    const selectedExtensionIds = this.getSelectedExtensionIds();
    this.debug(`deleteSelectedExtensions -- selectedExtensionIds.length=${selectedExtensionIds.length}`);

    const count = await this.fsbOptionsApi.deleteSelectedExtensions(selectedExtensionIds);

    for (const extensionId of selectedExtensionIds) {
      this.debug(`deleteSelectedExtensions -- extensionId="${extensionId}"`);
      const selectorTR      = `tr.extension-list-item[extensionId='${extensionId}']`;
      const extensionItemTR = document.querySelector(selectorTR);

      if (! extensionItemTR) {
        this.debug(`deleteSelectedExtensions -- FAILED TO SELECT TR "${selectorTR}"`);

      } else if (extensionItemTR.classList.contains("extension-locked")) {
        this.debug(`deleteSelectedExtensions -- Extension is LOCKED`);

      } else {
        this.debug(`deleteSelectedExtensions -- Removing TR for Extension extensionId="${extensionId}"`);
        extensionItemTR.remove();
      }
    }

    this.debug("deleteSelectedExtensions -- end");
  }



  getSelectedExtensionCount(e) {
    this.debug("getSelectedExtensionCount -- begin");

    const domSelectedExtensions = document.querySelectorAll("tr.extension-list-item.selected");
    this.debug(`getSelectedExtensionCount -- selectedExtensions.length=${domSelectedExtensions.length}`);

    this.debug("getSelectedExtensionCount -- end");

    return domSelectedExtensions.length;
  }

  getSelectedExtensionIds(e) {
    this.debug("getSelectedExtensionIds -- begin");

    const domSelectedExtensions = document.querySelectorAll("tr.extension-list-item.selected");
    this.debug(`getSelectedExtensionIds -- selectedExtensions.length=${domSelectedExtensions.length}`);
    const selectedExtensions = [];
    for (const domSelectedExtension of domSelectedExtensions) {
      this.debug(`getSelectedExtensionIds -- selected Extension Id: "${domSelectedExtension.getAttribute("extensionId")}"`);
      selectedExtensions.push(domSelectedExtension.getAttribute("extensionId"));
    }

    this.debug("getSelectedExtensionIds -- end");

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
      this.debug("showPopupWindow -- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");
    } else {
      this.debug( "showPopupWindow -- Got the Current (Main, mail:3pane) Window:"
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
      this.debug("showPopupWindow -- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`showPopupWindow -- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "showPopupWindow -- restoring previous window bounds:"
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

    this.debug(`showPopupWindow -- OptionsUI Popup Window Created -- windowId="${optionsWindow.id}" URL="${optionsUrl}"`);
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
