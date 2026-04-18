import { Logger                   } from '../modules/logger.js';
import { FsbOptions               } from '../modules/options.js';
import { FileSystemBrokerAPI      } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { FileSystemBrokerCommands } from '../modules/commands.js';
import { FsbEventLogger           } from '../modules/event_logger.js';
import { QuotaManager             } from '../modules/quotas.js';
import * as utils from '../modules/utilities.js';


/* TBD:
 */


class StorageManager {
  #CLASS_NAME    = this.constructor.name;

  #INFO          = false;
  #LOG           = false;
  #DEBUG         = false;
  #WARN          = false;

  #IGNORE_DIRECTORIES     = false;
  #IGNORE_DIRECTORY_NAMES = [ ".tmp.drivedownload", ".tmp.driveupload", "$Temp" ]; // these (hidden) directories are created by Google Drive & ProtonDrive, etc

  #logger        = new Logger();
  #fsbOptionsApi = new FsbOptions(this.#logger);
  #fsBrokerApi   = new FileSystemBrokerAPI();

  //// don't need to do any of his because we aren't using options that need FsbEventLogger MABXXX NOT REALLY TRUE ANYMORE - NEED THEM FOR QuotaManger
//#fsbCommandsApi = new FileSystemBrokerCommands(this.logger, this.fsbOptionsApi);
//#fsbEventLogger = new FsbEventLogger(this.#logger, this.#fsbOptionsApi, this.#fsbCommandsApi); // <---- this is why we need #fsbCommandsApi
//#fsbOptionsApi.setEventLogger(this.#fsbEventLogger);
//fsbCommandsApi.setEventLogger(this.#fsbEventLogger);


  // internal state
  #canceled = false;


  #listItemTooltip_deleteDirButton_fileSysRoot  = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_deleteDirButton_fileSystemRoot", "Cannot Delete FileSystemRoot" );
  #listItemTooltip_deleteDirButton_extSpecial   = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_deleteDirButton_extSpecial",    "Extension is 'SPECIAL'"        );
  #listItemTooltip_deleteDirButton_extDirProtect= utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_deleteDirButton_extDirProtect", "Delete PROTECTED Directory"    );
  #listItemTooltip_deleteDirButton_enabled      = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_deleteDirButton_enabled",       "Delete Directory"              );

  #listItemTooltip_extQuotaButton_noQuotas      = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extQuotaButton_noQuotas",       "No Quotas"                     );
  #listItemTooltip_extQuotaButton_fileSystemRoot= utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extQuotaButton_fileSystemRoot", "FileSystemRoot"                );
  #listItemTooltip_extQuotaButton_notConfigured = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extQuotaButton_notConfigured",  "Extension is NOT Configured"   );
  #listItemTooltip_extQuotaButton_extSpecial    = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extQuotaButton_extSpecial",     "Extension is 'SPECIAL'"        );
  #listItemTooltip_extQuotaButton_extNoQuotas   = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extQuotaButton_extNoQuotas",    "Extension has Quotas DISABLED" );
  #listItemTooltip_extQuotaButton_XXX           = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extQuotaButton_XXX",            "XXX"                           );
  #listItemTooltip_extQuotaButton_notOverQuotas = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extQuotaButton_notOverQuotas",  "Extension NOT Over its Quotas" );
  #listItemTooltip_extQuotaButton_overQuotas    = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extQuotaButton_overQuotas",     "Extension OVER its Quotas"     );

  #listHeaderText_dirName                       = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_directoryName",                  "Directory Name"                );
  #listHeaderText_dirPathName                   = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_directoryPathName",              "Directory PathName"            );
  #listHeaderText_extensionId                   = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_extensionId",                    "Extension ID"                  );
  #listHeaderText_extensionInstalled            = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_extensionInstalled",             "I?"                            );
  #listHeaderText_extensionEnabled              = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_extensionEnabled",               "E?"                            );
  #listHeaderText_extensionConfigured           = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_extensionConfigured",            "C?"                            );
  #listHeaderText_extensionSpecial              = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_extensionSpecial",               "S?"                            );
  #listHeaderText_extensionLocked               = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_extensionLocked",                "L?"                            );
  #listHeaderText_extensionReadOnly             = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_extensionReadOnly",              "R/O?"                          );
  #listHeaderText_extensionDirProtect           = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_extensionDirProtect",            "P?"                            );
  #listHeaderText_extensionAccessAllowed        = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_extensionAccessAllowed",         "G?"                            );

  #listHeaderText_count_items                   = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_count_items",                    "#I"                            );
  #listHeaderText_count_regular                 = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_count_type_regular",             "#R"                            );
  #listHeaderText_count_directory               = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_count_type_directory",           "#D"                            );
  #listHeaderText_count_other                   = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_count_type_other",               "#O"                            );
  #listHeaderText_count_unknown                 = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_count_type_unknown",             "#U"                            );
  #listHeaderText_count_error                   = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_count_type_error",               "#E"                            );

  #listHeaderText_time_creation_earliest        = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_time_creation_earliest",         ""                              );
  #listHeaderText_time_creation_latest          = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_time_creation_latest",           ""                              );
  #listHeaderText_time_lastAccessed_earliest    = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_time_lastAccessed_earliest",     ""                              );
  #listHeaderText_time_lastAccessed_latest      = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_time_lastAccessed_latest",       ""                              );
  #listHeaderText_time_lastModified_earliest    = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_time_lastModified_earliest",     ""                              );
  #listHeaderText_time_lastModified_latest      = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_time_lastModified_latest",       ""                              );

  #listHeaderText_size_smallest                 = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_size_smallest",                  ""                              );
  #listHeaderText_size_largest                  = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_size_largest",                   ""                              );
  #listHeaderText_size_total                    = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_text_size_total",                     ""                              );


  #listHeaderTooltip_dirName                    = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_directoryName",               "Directory Name"                );
  #listHeaderTooltip_dirPathName                = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_directoryName",               "Directory PathName"            );
  #listHeaderTooltip_extensionId                = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_extensionId",                 "Extension ID"                  );
  #listHeaderTooltip_extensionInstalled         = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_extensionInstalled",          "Installed?"                    );
  #listHeaderTooltip_extensionEnabled           = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_extensionEnabled",            "Enabled?"                      );
  #listHeaderTooltip_extensionConfigured        = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_extensionConfigured",         "Configured?"                   );
  #listHeaderTooltip_extensionSpecial           = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_extensionSpecial",            "Special?"                      );
  #listHeaderTooltip_extensionLocked            = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_extensionLocked",             "Locked?"                       );
  #listHeaderTooltip_extensionReadOnly          = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_extensionReadOnly",           "Read-Only?"                    );
  #listHeaderTooltip_extensionDirProtect        = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_extensionDirProtect",         "Directory Protected?"          );
  #listHeaderTooltip_extensionAccessAllowed     = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_extensionAccessAllowed",      "Access Allowed?"               );

  #listHeaderTooltip_count_items                = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_count_items",                 "Number of Items"               );
  #listHeaderTooltip_count_regular              = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_count_type_regular",          "Number of Regular Files"       );
  #listHeaderTooltip_count_directory            = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_count_type_directory",        "Number of Directories"         );
  #listHeaderTooltip_count_other                = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_count_type_other",            "Number of Other Items"         );
  #listHeaderTooltip_count_unknown              = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_count_type_unknown",          "Number of Unknown"             );
  #listHeaderTooltip_count_error                = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_count_type_error",            "Number of Errors getting Type" );

  #listHeaderTooltip_time_creation_earliest     = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_time_creation_earliest",      "Earliest Creation Time"        );
  #listHeaderTooltip_time_creation_latest       = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_time_creation_latest",        "Latest Creation Time"          );
  #listHeaderTooltip_time_lastAccessed_earliest = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_time_lastAccessed_earliest",  "Earliest Last Accessed Time"   );
  #listHeaderTooltip_time_lastAccessed_latest   = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_time_lastAccessed_latest",    "Latest Last Accessed Time"     );
  #listHeaderTooltip_time_lastModified_earliest = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_time_lastModified_earliest",  "Earliest Last MOdified Time"   );
  #listHeaderTooltip_time_lastModified_latest   = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_time_lastModified_latest",    "Latest Last MOdified Time"     );

  #listHeaderTooltip_size_smallest              = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_size_smallest",               "Smallest Regular File"         );
  #listHeaderTooltip_size_largest               = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_size_largest",                "Largest Regular File"          );
  #listHeaderTooltip_size_total                 = utils.getI18nMsg( "fsbStorageManager_directoryListHeader_tooltip_size_total",                  "Total of Regular File sizes"   );

  #listItemTooltip_extInstalled                 = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionInstalled",            "Extension is Installed"        );
  #listItemTooltip_extNotInstalled              = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionNotInstalled",         "Extension is NOT Installed"    );
  #listItemTooltip_extEnabled                   = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionEnabled",              "Extension is Enabled"          );
  #listItemTooltip_extDisabled                  = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionDisabled",             "Extension is Disabled"         );
  #listItemTooltip_extConfigured                = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionConfigured",           "Extension is Configured"       );
  #listItemTooltip_extNotConfigured             = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionNotConfigured",        "Extension is NOT Configured"   );
  #listItemTooltip_extSpecial                   = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionSpecial",              "Extension is Special"          );
  #listItemTooltip_extNotSpecial                = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionNotSpecial",           "Extension is NOT Special"      );
  #listItemTooltip_extLocked                    = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionLocked",               "Extension is Locked"           );
  #listItemTooltip_extNotLocked                 = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionNotLocked",            "Extension is NOT Locked"       );
  #listItemTooltip_extReadOnly                  = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionReadOnly",             "Extension is Read-Only"        );
  #listItemTooltip_extNotReadOnly               = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionNotReadOnly",          "Extension is NOT Read-Only"    );
  #listItemTooltip_extNotReadOnly_notAccessAllowed= utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extNotReadOnly_notAccessAllowed", "Extension is NOT Read-Only");
  #listItemTooltip_extNotReadOnly_notConfigured = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extNotReadOnly_notConfigured",  "Extension is NOT Read-Only"    );
  #listItemTooltip_extDirProtect                = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionDirProtect",           "Extension is Dir Protected"    );
  #listItemTooltip_extNotDirProtect             = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionNotDirProtect",        "Extension is NOT Dir Protected");
  #listItemTooltip_extAccessAllowed             = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionAccessAllowed",        "Extension is Granted Access"   );
  #listItemTooltip_extNotAccessAllowed          = utils.getI18nMsg( "fsbStorageManager_directoryListItem_tooltip_extensionNotAccessAllowed",     "Extension is NOT Granted Access");



  constructor() {
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
                       "\n- name:    " + e.name,
                       "\n- message: " + e.message,
                       "\n- stack:   " + e.stack,
                       ...info
                     );
  }



  async run(e) {
    this.debug("-- begin");

    window.addEventListener("beforeunload", (e) => this.#windowUnloading(e));

    const showInstructions = await this.#fsbOptionsApi.isEnabledShowStorageManagerInstructions();
    this.#showHideInstructions(showInstructions);

    await this.#populateSelectUIs();
    await this.#updateOptionsUI();
    await this.#localizePage();
    await this.#buildUI();
    this.#setupEventListeners();
  }



  #setupEventListeners() {
    document.addEventListener( 'change', (e) => this.#optionChanged(e) );  // One of the checkboxes or radio buttons, etc, has changed or a select has changed
    document.addEventListener( "click",  (e) => this.#actionClicked(e) );  // Something was clicked


    const quotasTrialRunBtn = document.getElementById("fsbStorageManagerQuotasTrialRunButton");
    if (! quotasTrialRunBtn) {
      this.error("Failed to get element '#fsbStorageManagerQuotasTrialRunButton'");
    } else {
      quotasTrialRunBtn.addEventListener('click', (e) => this.#quotasTrialRunButtonClicked(e));
    }

    const runQuotasCheckBtn = document.getElementById("fsbStorageManagerRunQuotasCheckButton");
    if (! runQuotasCheckBtn) {
      this.error("Failed to get element '#fsbStorageManagerRunQuotasCheckButton'");
    } else {
      runQuotasCheckBtn.addEventListener('click', (e) => this.#runQuotasCheckButtonClicked(e));
    }

    const resetAllExtensionsBtn = document.getElementById("fsbStorageManagerResetAllExtensionQuotasButton");
    if (! resetAllExtensionsBtn) {
      this.error("Failed to get element '#fsbStorageManagerResetAllExtensionQuotasButton'");
    } else {
      resetAllExtensionsBtn.addEventListener('click', (e) => this.#resetAllExtQuotasButtonClicked(e));
    }

    const doneBtn = document.getElementById("fsbStorageManagerDoneButton");
    if (! doneBtn) {
      this.error("Failed to get element '#fsbStorageManagerDoneButton'");
    } else {
      doneBtn.addEventListener('click', (e) => this.#doneButtonClicked(e));
    }

    const refreshBtn = document.getElementById("fsbStorageManagerRefreshButton");
    if (! refreshBtn) {
      this.error("Failed to get element '#fsbStorageManagerRefreshButton'");
    } else {
      refreshBtn.addEventListener('click', (e) => this.#refreshButtonClicked(e));
    }

    const quotaNumberInputSelector = "input[type='number'].quota-setting";
    const quotaNumberInputs        = document.querySelectorAll(quotaNumberInputSelector);
    if (! quotaNumberInputs || quotaNumberInputs.length < 1) {
      this.error(`--- FAILED TO FIND Number Inputs - selector="${quotaNumberInputSelector}"`);
    } else {
      for (const quotaNumberInput of quotaNumberInputs) {

        // this is difficult/impossible to do with CSS
        const maxDigits = quotaNumberInput.getAttribute("maxDigits");
        if (maxDigits) {
          const maxDigitsNum = Number(maxDigits);
          if (Number.isInteger(maxDigitsNum)) {
            quotaNumberInput.style.setProperty('width', `${maxDigitsNum + 3}ch`);
          }
        }

        quotaNumberInput.addEventListener( 'keydown', (e) => this.#quotaNumberInputKeyDown(e)        ); // must pass the event
        quotaNumberInput.addEventListener( 'change',  (e) => this.#quotaNumberInputChanged(e.target) ); // must pass the event target element!!!
        quotaNumberInput.addEventListener( 'paste',   (e) => this.#quotaNumberInputPaste(e)          ); // must pass the event
      }
    }
  }



  async #localizePage() {
    this.debug("-- start");

    for (const el of document.querySelectorAll("[data-l10n-id]")) {
      const id = el.getAttribute("data-l10n-id");
      let i18nMessage = browser.i18n.getMessage(id);
      if (i18nMessage == "") {
        i18nMessage = id;
      }
      el.textContent = i18nMessage;
    }

    for (const el of document.querySelectorAll("[data-html-l10n-id]")) {
      const id = el.getAttribute("data-html-l10n-id");
      let i18nMessage = browser.i18n.getMessage(id);
      if (i18nMessage == "") {
        i18nMessage = id;
      }
      el.insertAdjacentHTML('afterbegin', i18nMessage);
    }

    this.debug("-- end");
  }



  async #populateSelectUIs() {
    await this.#populateQuotaCheckUnitsSelect();
    await this.#populateQuotaCheckDaysSelect();
    await this.#populateQuotaCheckHoursSelect();
    await this.#populateQuotaCheckMinutesSelect();
////await this.#populateQuotaCheckMinutesOffsetSelect(); // not a select now
  }

  async #populateQuotaCheckUnitsSelect() {
    const select = document.getElementById('fsbQuotaCheckUnit');

    if (! select) {
      this.error("FAILED TO GET Quota Check Units Select - id='fsbQuotaCheckUnit'");
    } else {
      var option;

      option = document.createElement('option');
      option.value       = ""
      option.textContent = utils.getI18nMsg("fsbStorageManager_quotaCheckUnitSelect_option_none", "---select---");
      select.appendChild(option);

      option = document.createElement('option');
      option.value       = "daily"
      option.textContent = utils.getI18nMsg("fsbStorageManager_quotaCheckUnitSelect_option_daily", "Daily");
      select.appendChild(option);

      option = document.createElement('option');
      option.value       = "hourly"
      option.textContent = utils.getI18nMsg("fsbStorageManager_quotaCheckUnitSelect_option_hourly", "Daily");
      select.appendChild(option);

      option = document.createElement('option');
      option.value       = "minutely"
      option.textContent = utils.getI18nMsg("fsbStorageManager_quotaCheckUnitSelect_option_minutely", "By Minute");
      select.appendChild(option);
    }
  }

  async #populateQuotaCheckDaysSelect() {
    const select = document.getElementById('fsbQuotaCheckDays');

    if (! select) {
      this.error("FAILED TO GET Quota Check Days Select - id='fsbQuotaCheckDays'");
    } else {
      var option;

      option = document.createElement('option');
      option.value       = ""
      option.textContent = utils.getI18nMsg("fsbStorageManager_quotaCheckDaysSelect_option_none", "---select---");
      select.appendChild(option);

      for (var i = 1; i <= 7; ++i) {
        const stringValue = String(i);
        option = document.createElement('option');
        option.value       = stringValue;
        option.textContent = stringValue;
        select.appendChild(option);
      }
    }
  }

  async #populateQuotaCheckHoursSelect() {
    const select = document.getElementById('fsbQuotaCheckHours');

    if (! select) {
      this.error("FAILED TO GET Quota Check Hours Select - id='fsbQuotaCheckHours'");
    } else {
      var option;

      option = document.createElement('option');
      option.value       = ""
      option.textContent = utils.getI18nMsg("fsbStorageManager_quotaCheckHoursSelect_option_none", "---select---");
      select.appendChild(option);

      for (var i = 1; i <= 23; ++i) {
        const stringValue = String(i);
        option = document.createElement('option');
        option.value       = stringValue;
        option.textContent = stringValue;
        select.appendChild(option);
      }
    }
  }

  async #populateQuotaCheckMinutesSelect() {
    const select = document.getElementById('fsbQuotaCheckMinutes');

    if (! select) {
      this.error("FAILED TO GET Quota Check Minutes Select - id='fsbQuotaCheckMinutes'");
    } else {
      var option;

      for (var i = 5; i <= 45; i+=5) { // every 5, 10, 15, 20, 25, 30, ... 45 minutes
        const stringValue = String(i);
        option = document.createElement('option');
        option.value       = stringValue;
        option.textContent = stringValue;
        select.appendChild(option);
      }
    }
  }

  async #populateQuotaCheckMinutesOffsetSelect() {
    const select = document.getElementById('fsbQuotaCheckMinutesOffset');

    if (! select) {
      this.error("FAILED TO GET Quota Check Minutes Offset Select - id='fsbQuotaCheckMinutesOffset'");
    } else {
      var option;

      for (var i = 0; i <= 59; ++i) { // starting at 0 to 59 minutes after the  current?  next?  hour
        const stringValue = String(i);
        option = document.createElement('option');
        option.value       = stringValue;
        option.textContent = stringValue;
        select.appendChild(option);
      }
    }
  }



  async #updateOptionsUI() {
    this.debug("-- start");

    const options = await this.#fsbOptionsApi.getAllOptions();

    this.debug("-- sync options to UI");
    for (const [optionName, optionValue] of Object.entries(options)) {
      this.debug("-- option: ", optionName, "value: ", optionValue);

      const optionElement = document.getElementById(optionName);

      if (optionElement && optionElement.classList.contains("fsbGeneralOption")) { // <-----------------------------------------------------------------------<<<<<

        if (optionElement.tagName === 'INPUT') {

          switch (optionElement.type) {
            case 'checkbox': {
                var checked = optionValue;

                if ((typeof checked) === 'boolean') {
                } else if ((typeof optionValue) === 'string') {
                  checked = checked.toLowerCase();
                  checked = (checked === 'true') ? true : false;
                } else {
                  checked = false;
                }

                optionElement.checked = checked; // setting the checked state here!!!

                if (optionElement.classList.contains("open-close-check")) {
                  if (await this.#openCloseCheckboxChanged(optionElement)) { // if it got handled, we're done
                    break; // <-----------------------------------------------------------------------------------<<<<<
                  }
                }

                switch (optionElement.id ) {
                  case "fsbQuotaCheckSchedulingBlocked":
                    await this.#updateUIForQuotaCheckSchedulingBlocked(optionElement, false);
                    break;
                  case "fsbQuotaCheckEnabled":
                  case "fsbStorageQuotaEnabled":
                  case "fsbFileSizeQuotaEnabled":
                  case "fsbFileCountQuotaEnabled":
                    await this.#quotaCheckEnabledCheckboxChanged(optionElement);
                    break;
                }

                break;
              }

            case 'radio': {
                var checked = optionValue;

                if ((typeof checked) === 'boolean') {
                } else if ((typeof optionValue) === 'string') {
                  checked = checked.toLowerCase();
                  checked = (checked === 'true') ? true : false;
                } else {
                  checked = false;
                }

                // get all the elements with the same name, and if they're a radio, un-check them
                if (! checked) {
                  // don't need to worry about radion group if WE are not checked
                } else if (! optionElement.name) {
                  this.debug('-- Radio Button has no Radio Group Name');
                } else {
                  const radioGroupName = optionElement.name;
                  const radioGroup     = document.querySelectorAll(`input[type="radio"][name="${radioGroupName}"]`);

                  this.debug(`-- Radio Button has Group Name: '${radioGroupName}'`);

                  if (! radioGroup) {
                    this.debug(`-- Radio Group '${radioGroupName}' members not found`); // how could this happen?  There must be at least one!  US!!!
                  } else {
                    this.debug(`-- Radio Group '${radioGroupName}' members length=${radioGroup.length}`);
                    if (radioGroup.length < 2) {
                      this.debug(`-- No Radio Group '${radioGroupName}' members to reset (length < 2)`);
                    } else {
                      for (const radio of radioGroup) {
                        if (radio.id != optionElement.id) { // don't un-check the one that's getting set // MABXXX WHAT IF THEY HAVE NO IDs???
                          this.debug(`-- resetting radio button ${radio.id}`);
                          radio.checked = false;
                        }
                      }
                    }
                  }
                }

                optionElement.value = checked;

                break;
              }

            case 'text': {
                optionElement.value = optionValue;
                break;
              }

            case 'time': {
                var time = optionValue;

                var timeMS = utils.timeToMS(time); // returns 0 if invalid format
                if (timeMS === 0) time = "00:00:00";

                optionElement.value = time;
                break;
              }

            case 'number': {
                var numberValue = optionValue;

                // check max, min, maxDigits, etc?
                if (Number.isInteger(numberValue)) {
                  if (numberValue < 0) numberValue= 0;
                } else if ((typeof numberValue) === 'string') {
                  numberValue = Number(numberValue);
                  if (isNaN(numberValue)) numberValue = 0;
                } else {
                  numberValue = 0;
                }

                optionElement.value = numberValue;

                if (optionElement.classList.contains('quota-setting')) {
                  await this.#quotaNumberInputChanged(optionElement);
                }
                break;
              }

            default:
              // we don't handle this input type
          }

        } else if (optionElement.tagName === 'SELECT') {
          optionElement.value = optionValue;

          const selectId = optionElement.getAttribute("id");
          switch (selectId) {
            case "fsbQuotaCheckUnit":
              await this.#fsbQuotaCheckUnitSelectChanged(optionElement, selectId, optionValue);
              break;
          }

        } else {
          // we don't handle this tag
        }
      }
    }

    this.debug("-- end");
  }



  async #updateUIForQuotaCheckSchedulingBlocked(checkbox, optionChanged) { // optionChanged - true: the USER just changed the option, false: updating stored settings
    const quotaCheckSettingsPanel = document.getElementById('fsbStorageManagerQuotaCheckSettings');
    const hintsPanel              = document.getElementById('fsbQuotaCheckSchedulingBlockedHintsPanel');       // .messaages-panel
    const reminderPanel           = document.getElementById('fsbQuotaCheckSchedulingUnblockedReminderPanel');  // .messaages-panel

    if (! hintsPanel) {
      this.error("FAILED TO GET Quota Check Blocked Hints Panel - id='fsbQuotaCheckSchedulingBlockedHintsPanel'");
    }

    if (! quotaCheckSettingsPanel) {
      this.error("FAILED TO GET Quota Check Settings Panel - id='fsbStorageManagerQuotaCheckSettings'");
    } else {
      if (checkbox.checked) { // BLOCKED???
        quotaCheckSettingsPanel.style.setProperty(            'display', 'NONE'  ); // Don't display Scheduled Quota Check Options
        if (hintsPanel)      hintsPanel.style.setProperty(    'display', 'FLEX'  ); // Tell them how to Un-Block
        if (reminderPanel)   reminderPanel.style.setProperty( 'display', 'NONE'  ); // Don't remind them to restart Thunderbird
      } else {                // NOT BLOCKED
        quotaCheckSettingsPanel.style.setProperty(            'display', 'BLOCK' ); // Display Scheduled Quota Check Options
        if (hintsPanel)      hintsPanel.style.setProperty(    'display', 'NONE'  ); // Don't tell them how to Un-Block
        if (reminderPanel) {
          if (optionChanged) reminderPanel.style.setProperty( 'display', 'FLEX'  ); // If they just now Un-Blocked, remind them to restart Thunderbird
          else               reminderPanel.style.setProperty( 'display', 'NONE'  ); // Otherwise don't remind them to restart Thunderbird
        }
      }
    }
  }



  async #quotaCheckEnabledCheckboxChanged(checkbox) {
    switch (checkbox.id) {
      case "fsbQuotaCheckEnabled":
        const schedulePanel = document.getElementById('fsbStorageManagerQuotaCheckSchedulePanel');

        if (! schedulePanel) {
          this.error("FAILED TO GET Quota Schedule Panel - id='fsbStorageManagerQuotaCheckSchedulePanel'");
        } else {
          if (checkbox.checked) {
            schedulePanel.style.setProperty('display', 'block');
          } else {
            schedulePanel.style.setProperty('display', 'none');
          }
        }
        break;
      case "fsbStorageQuotaEnabled":
        break;
      case "fsbFileSizeQuotaEnabled":
        break;
      case "fsbFileCountQuotaEnabled":
        break;
    }
  }



  async #fsbQuotaCheckUnitSelectChanged(selectElement, selectId, value) {
    this.debugAlways(`\nbegin - selectId="${selectId}" value="${value}"`);

    const daysDiv    = document.getElementById('fsbStorageManagerQuotaCheckDays');
    const hoursDiv   = document.getElementById('fsbStorageManagerQuotaCheckHours');
    const minutesDiv = document.getElementById('fsbStorageManagerQuotaCheckMinutes');

    if (! daysDiv)    this.error("FAILED TO GET daysDiv: id='fsbStorageManagerQuotaCheckDays'");
    if (! hoursDiv)   this.error("FAILED TO GET hoursDiv: id='fsbStorageManagerQuotaCheckHours'");
    if (! minutesDiv) this.error("FAILED TO GET minutesDiv: id='fsbStorageManagerQuotaCheckMinutes'");

    switch (value) {
      case 'daily':
        this.debugAlways(`\nselectId="${selectId}" value="${value}" >>> daily`);
        if (daysDiv)    daysDiv.style.setProperty(    'display', 'block' ); // <------------------------ show this one ---------------------<<<<<
        if (hoursDiv)   hoursDiv.style.setProperty(   'display', 'none'  );
        if (minutesDiv) minutesDiv.style.setProperty( 'display', 'none'  );
        break;

      case 'hourly':
        this.debugAlways(`\nselectId="${selectId}" value="${value}" >>> hourly`);
        if (daysDiv)    daysDiv.style.setProperty(    'display', 'none'  );
        if (hoursDiv)   hoursDiv.style.setProperty(   'display', 'block' ); // <------------------------ show this one ---------------------<<<<<
        if (minutesDiv) minutesDiv.style.setProperty( 'display', 'none'  );
        break;

      case 'minutely':
        this.debugAlways(`\nselectId="${selectId}" value="${value}" >>> minutely`);
        if (daysDiv)    daysDiv.style.setProperty(    'display', 'none'  );
        if (hoursDiv)   hoursDiv.style.setProperty(   'display', 'none'  );
        if (minutesDiv) minutesDiv.style.setProperty( 'display', 'block' ); // <------------------------ show this one ---------------------<<<<<
        break;

      default:
        this.debugAlways(`\nselectId="${selectId}" value="${value}" >>> ?????`);
        if (daysDiv)    daysDiv.style.setProperty(    'display', 'none' );
        if (hoursDiv)   hoursDiv.style.setProperty(   'display', 'none' );
        if (minutesDiv) minutesDiv.style.setProperty( 'display', 'none' );
    }

    this.debugAlways(`\nend - selectId="${selectId}" value="${value}"`);
  }



  async #quotaNumberInputKeyDown(e) {
    if (! utils.eventHasValidNumberInputKey(e)) {
      e.preventDefault(); // <-----------------------------------------this is why we pass in the event and not the element
    }

    var   maxDigits = 0;
    const maxDigitsAttr = e.target.getAttribute("maxDigits");
    if (maxDigitsAttr) {
      const num = Number(maxDigitsAttr);
      if (Number.isInteger(num)) {
        maxDigits = num;
      }
    }

    if (e.target.value && maxDigits > 0 && e.target.value.length >= maxDigits && ! utils.eventHasValidInputEditOrMoveKey(e)) {
      e.preventDefault(); // <-----------------------------------------this is why we pass in the event and not the element
    }
  }

  async #quotaNumberInputChanged(numberInput) { // updateOptionsUI calls us, and it doesn't have an event to pass to us
    if (! numberInput.checkValidity()) {
      if (numberInput.validity.rangeOverflow)  numberInput.value = numberInput.max;
      if (numberInput.validity.rangeUnderflow) numberInput.value = numberInput.min;
    }
  }

  async #quotaNumberInputPaste(e) {
    var   maxDigits = 0;
    const maxDigitsAttr = e.target.getAttribute("maxDigits");
    if (maxDigitsAttr) {
      const num = Number(maxDigitsAttr);
      if (Number.isInteger(num)) {
        maxDigits = num;
      }
    }

    if (! utils.eventHasValidNumberInputPasteData(e, maxDigits)) {
      e.preventDefault(); // <-----------------------------------------this is why we pass in the event and not the element
    }
  }



  // This listener is attached to the DOCUMENT, so it will get every click event.
  async #actionClicked(e) {
    this.debug('--');
    if (e === null) return;

    if (e.target.tagName === "SPAN") {
      const span   = e.target;
      const spanId = span.id;

      this.debug(`-- SPAN Clicked id="${spanId}", classList:`, span.classList);

      if (span.classList.contains("open-close-widget")) {
        await this.#openCloseWidgetSpanClicked(e, span);
      } else {
        this.debug(`-- NOT A SPAN WE CARE ABOUT -- id="${spanId}", classList:`, span.classList);
      }
    } else {
    }
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




  // One of the Options Input checkboxes, radio buttons, text, or number fields (etc) or select options has been clicked or changed
  //
  // This listener is attached to the DOCUMENT, so it will get every change event.
  //
  // initially copied from optionsUI.js, so this may do a lot that we don't really need for now.
  async #optionChanged(e) {
    if (e == null) return;

    this.debug(`-- tagName="${e.target.tagName}" type="${e.target.type}" fsbGeneralOption? ${e.target.classList.contains("fsbGeneralOption")} id="${e.target.id}"`);

    var target = e.target;

    if (target.classList.contains("fsbGeneralOption")) {
      const optionName = target.id;

      if (target.tagName == 'INPUT') {

        switch (target.type) {

          case 'radio': {
              const checked = target.checked;

              this.debug(`-- radio buttton selected ${checked}=<${checked}> - group=${target.name}`);

              // first, set this option
              this.debug(`-- Saving Radio Option {[${optionName}]: ${checked}}`);
              await this.#fsbOptionsApi.saveOption(optionName, checked);

              // get all the elements with the same name, and if they're a radio, un-check them
              if (target.name) {
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
                      if (radio.id != optionName) { // don't un-check the one that fired
                        this.debug(`-- resetting radio button {[${radio.id}]: false}`);
                        await this.#fsbOptionsApi.storeOption(
                          { [radio.id]: false }
                        );
                      }
                    }
                  }
                }
              }
              break;
            }

          case 'checkbox': {
              const checked = target.checked;

              this.debug(`-- Saving Checkbox Option {[${optionName}]: ${checked}}`);
              await this.#fsbOptionsApi.saveOption(optionName, checked);

              // special processing for these checkboxes
              if (target.classList.contains('open-close-check')) {
                if (await this.#openCloseCheckboxChanged(target)) { // if it doesn't require special processing, we're done
                  break; // <-----------------------------------------------------------------------------------<<<<<
                }
              }

              switch (optionName) {
                case "fsbQuotaCheckSchedulingBlocked":
                  await this.#updateUIForQuotaCheckSchedulingBlocked(target, true);
                  break;
                case "fsbQuotaCheckEnabled":
                case "fsbStorageQuotaEnabled":
                case "fsbFileSizeQuotaEnabled":
                case "fsbFileCountQuotaEnabled":
                  await this.#quotaCheckEnabledCheckboxChanged(target);
                  break;
              }

              switch (optionName) {
                case "fsbShowStorageManagerInstructions":
                  this.#showHideInstructions(checked);
                  break;
              }

              break;
            }

          case 'text': {
              const text = target.value;

              this.debug(`-- Setting Text Option {[${optionName}]: ${text}}`);
              await this.#fsbOptionsApi.saveOption(optionName, text);

              break;
            }

          case 'time': {
              var time = target.value;

              var timeMS = utils.timeToMS(time); // returns 0 if invalid format
              if (timeMS === 0) time = "00:00:00";

              this.debug(`-- Saving Time Option {[${optionName}]: ${time}}`);
              await this.#fsbOptionsApi.saveOption(optionName, time);

              break;
            }

          case 'number': {
//            // These elements have their own change listeners to handle this
//            if (target.classList.contains('quota-setting')) {
//              await this.#quotaNumberInputChanged(target);
//            }

              var  numberValue = Number(target.value);

              if (Number.isInteger(numberValue)) {
                if (numberValue < 0) numberValue = 0;
              } else {
                numberValue = 0;
              }

              this.debug(`-- Saving Number Option {[${optionName}]: ${numberValue}}`);
              await this.#fsbOptionsApi.saveOption(optionName, numberValue);

              break;
            }

          default:
            this.debug(`Unexpected Option Input type: "${target.type}"`);
        }

      } else if (target.tagName === 'SELECT') {
        const value = target.value;

        this.debugAlways(`-- Saving Select Option {[${optionName}]: ${value}}`);
        await this.#fsbOptionsApi.saveOption(optionName, value);
        this.debugAlways("-- Saved it");

        switch (optionName) {
          case "fsbQuotaCheckUnit":
            await this.#fsbQuotaCheckUnitSelectChanged(target, optionName, value);
            break;
        }

      } else {
        this.debug(`Unexpected fsbGeneralOption Tag TagName: "${target.tagName}"`);
      }

    } else {
      this.debug("Not an 'fsbGeneralOption':", target);
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



  #showHideInstructions(show) {
    this.debug(`-- show=${show}`);
    const panel = document.getElementById("fsbStorageManagerInstructions");
    if (panel) {
      if (show) {
        panel.style.setProperty('display', 'BLOCK');
      } else {
        panel.style.setProperty('display', 'NONE');
      }
    }
  }



  async #windowUnloading(e) {
    if (this.DEBUG) this.debugAlways( "--- Window Unloading ---"
                                      + `\n- window.screenTop=${window.screenTop}`
                                      + `\n- window.screenLeft=${window.screenLeft}`
                                      + `\n- window.outerWidth=${window.outerWidth}`
                                      + `\n- window.outerHeight=${window.outerHeight}`
                                      + `\n- this.#canceled=${this.#canceled}`
                                    );
    await this.#fsbOptionsApi.storeWindowBounds("storageManagerWindowBounds", window);

    if (this.DEBUG) {
      let bounds = await this.#fsbOptionsApi.getWindowBounds("storageManagerWindowBounds");

      if (! bounds) {
        this.debugAlways("--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- FAILED TO GET Stats Manager Window Bounds ---");
      } else if (typeof bounds !== 'object') {
        this.debugAlways(`--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- Stats Manager Window Bounds IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
      } else {
        this.debugAlways( "--- Retrieve Stored Window Bounds ---"
                          + `\n- bounds.top:    ${bounds.top}`
                          + `\n- bounds.left:   ${bounds.left}`
                          + `\n- bounds.width:  ${bounds.width}`
                          + `\n- bounds.height: ${bounds.height}`
                        );
      }
    }

    // Tell Thunderbird to close the window
    e.returnValue = '';  // any "non-truthy" value will do
    return false;
  }



  async #buildUI() {
    this.#resetMessages();
    this.#resetErrors();

    const domDirectoryList = document.getElementById("fsbStorageManagerDirectoryList");
    if (! domDirectoryList) {
      this.error("-- failed to get element #fsbStorageManagerDirectoryList");
      this.#setErrorFor("fsbStorageManagerTitlePanel", "fsbStorageManager_error_noDirectoryListElement");
      return;
    }

    domDirectoryList.innerHTML = '';
    this.#updateUIOnSelectionChanged();

    const loadingTR = document.createElement("tr");
      const loadingTD = document.createElement("td");
        loadingTD.classList.add("data-loading-message");
        const msg = utils.getI18nMsg("fsbStorageManager_message_directoryListLoading", "...");
        loadingTD.appendChild( document.createTextNode(msg) );
      loadingTR.appendChild(loadingTD);
    domDirectoryList.appendChild(loadingTR);

    const stats = await this.#getFsbStats();
    this.debug("---stats\n", stats);
    const fsbStats           = stats?.fsbStats
    const fsbDirStats        = stats?.dirStats
    const allExtensionsProps = await this.#fsbOptionsApi.getExtensionsProps();;

    if (! stats) {
      this.error("---NO stats");
      this.#setErrorFor("fsbStorageManagerTitlePanel", "fsbStorageManager_error_noStats");
    } else if (! allExtensionsProps) {
      this.error("---NO allExtensionsProps");
      this.#setErrorFor("fsbStorageManagerTitlePanel", "fsbStorageManager_error_noExtensionsProps");
    } else {
      await this.#setFsbStatsUI(fsbStats, allExtensionsProps);

      await this.#buildDirectoryListUI(domDirectoryList, fsbDirStats, allExtensionsProps);
    }
  }



  async #setFsbStatsUI(fsbStats, allExtensionsProps) {
    this.debug("\n===================fsbStats:\n", fsbStats);

    if (! fsbStats) {
      this.error("---NO fsbStats");
      this.#setErrorFor("fsbStorageManagerTitlePanel", "fsbStorageManager_error_noStats");
      // return; // don't just return.  Let the code below clear everything instead
    } else if (! allExtensionsProps) {
      this.error("---NO ExtensionsProps");
      this.#setErrorFor("fsbStorageManagerTitlePanel", "fsbStorageManager_error_noExtensionsProps");
      // return; // don't just return.  Let the code below clear everything instead
    }

    var extOverAnyQuotaCount       = 0;
    var extOverStorageQuotaCount   = 0;
    var extOverFileSizeQuotaCount  = 0;
    var extOverFileCountQuotaCount = 0;

    // calculate extension over quota counts from the Extension Props
    if (allExtensionsProps) {
      for (const [extId, extProps] of Object.entries(allExtensionsProps)) {
        var extOverAnyQuota       = false;
        var extOverStorageQuota   = extProps['overStorageQuota'];
        var extOverFileSizeQuota  = extProps['overFileSizeQuota'];
        var extOverFileCountQuota = extProps['overFileCountQuota'];

        if ( (typeof extOverStorageQuota  ) !== 'boolean' ) extOverStorageQuota   = false;
        if ( (typeof extOverFileSizeQuota ) !== 'boolean' ) extOverFileSizeQuota  = false;
        if ( (typeof extOverFileCountQuota) !== 'boolean' ) extOverFileCountQuota = false;

        if (extOverStorageQuota) {
          ++extOverStorageQuotaCount;
          extOverAnyQuota = true;
        }

        if (extOverFileSizeQuota) {
          ++extOverFileSizeQuotaCount;
          extOverAnyQuota = true;
        }

        if (extOverFileCountQuota) {
          ++extOverFileCountQuotaCount;
          extOverAnyQuota = true;
        }

        if (extOverAnyQuota) ++extOverAnyQuotaCount;
      }
    }

    var element;

    element = document.getElementById("stats_data_dir_name");
    if (element) {
      if ((typeof fsbStats.dirName) === 'string') {
        element.textContent = fsbStats.dirName;
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_dir_path");
    if (element) {
      if ((typeof fsbStats.dirPath) === 'string') {
        element.textContent = fsbStats.dirPath;
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_count_total");
    if (element) {
      if (Number.isInteger(fsbStats.count_total)) {
        element.textContent = fsbStats.count_total;
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_count_type_regular");
    if (element) {
      if (Number.isInteger(fsbStats.count_type_regular)) {
        element.textContent = fsbStats.count_type_regular;
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_count_type_directory");
    if (element) {
      if (Number.isInteger(fsbStats.count_type_directory)) {
        element.textContent = fsbStats.count_type_directory;
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_count_type_other");
    if (element) {
      if (Number.isInteger(fsbStats.count_type_other)) {
        element.textContent = fsbStats.count_type_other;
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_count_type_unknown");
    if (element) {
      if (Number.isInteger(fsbStats.count_type_unknown)) {
        element.textContent = fsbStats.count_type_unknown;
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_count_type_error");
    if (element) {
      if (Number.isInteger(fsbStats.count_type_error)) {
        element.textContent = fsbStats.count_type_error;
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_size_smallest");
    if (element) {
      if (Number.isInteger(fsbStats.size_smallest)) {
        element.textContent = await messenger.messengerUtilities.formatFileSize( fsbStats.size_smallest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_size_largest");
    if (element) {
      if (Number.isInteger(fsbStats.size_largest)) {
        element.textContent = await messenger.messengerUtilities.formatFileSize( fsbStats.size_largest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_size_total");
    if (element) {
      if (Number.isInteger(fsbStats.size_total)) {
        element.textContent = await messenger.messengerUtilities.formatFileSize( fsbStats.size_total );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_time_creation_earliest");
    if (element) {
      if (Number.isInteger(fsbStats.time_fileCreation_earliest)) {
        element.textContent = utils.formatMsToDateTime24HR( fsbStats.time_fileCreation_earliest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_time_creation_latest");
    if (element) {
      if (Number.isInteger(fsbStats.time_fileCreation_latest)) {
        element.textContent = utils.formatMsToDateTime24HR( fsbStats.time_fileCreation_latest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_time_last_accessed_earliest");
    if (element) {
      if (Number.isInteger(fsbStats.time_fileLastAccessed_earliest)) {
        element.textContent = utils.formatMsToDateTime24HR( fsbStats.time_fileLastAccessed_earliest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_time_last_accessed_latest");
    if (element) {
      if (Number.isInteger(fsbStats.time_fileLastAccessed_latest)) {
        element.textContent = utils.formatMsToDateTime24HR( fsbStats.time_fileLastAccessed_latest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_time_last_modified_earliest");
    if (element) {
      if (Number.isInteger(fsbStats.time_fileLastModified_earliest)) {
        element.textContent = utils.formatMsToDateTime24HR( fsbStats.time_fileLastModified_earliest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_time_last_modified_latest");
    if (element) {
      if (Number.isInteger(fsbStats.time_fileLastModified_latest)) {
        element.textContent = utils.formatMsToDateTime24HR( fsbStats.time_fileLastModified_latest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_quota_any");
    if (element) {
      if (allExtensionsProps) {
        element.textContent = String(extOverAnyQuotaCount);
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_quota_storage");
    if (element) {
      if (allExtensionsProps) {
        element.textContent = String(extOverStorageQuotaCount);
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_quota_fileSize");
    if (element) {
      if (allExtensionsProps) {
        element.textContent = String(extOverFileSizeQuotaCount);
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_quota_fileCount");
    if (element) {
      if (allExtensionsProps) {
        element.textContent = String(extOverFileCountQuotaCount);
      } else {
        element.textContent = "";
      }
    }
  }



  async #updateFsbStatsUI() {
    const stats    = await this.#getFsbStats(false);
    const fsbStats = stats?.fsbStats

    this.debug("---stats\n", stats);

    if (! stats) {
      this.error("---NO stats");
      this.#setErrorFor("fsbStorageManagerTitlePanel", "fsbStorageManager_error_noDirectories"); /// MABXXX NEED A DIFFERENT ERROR MESSAGE
    } else {
      const allExtensionsProps = await this.#fsbOptionsApi.getExtensionsProps();;
      await this.#setFsbStatsUI(fsbStats, allExtensionsProps);
    }
  }



  async #buildDirectoryListUI(domDirectoryList, fsbDirStats, allExtensionsProps) {
    this.debug("\n===================fsbDirStats:\n", fsbDirStats);

    domDirectoryList.innerHTML = '';

    if (! fsbDirStats) {
      this.error("---NO fsbDirStats");
      this.#setErrorFor("fsbStorageManagerTitlePanel", "fsbStorageManager_error_noDirectories");
      return;

    } else if (Object.keys(fsbDirStats).length < 1) {
      this.error("---fsbDirStats.length < 1");
      this.#setErrorFor("fsbStorageManagerTitlePanel", "fsbStorageManager_error_noDirectories");
      return;

    } else {
      for (const dirName of Object.keys(fsbDirStats)) {
        if (this.#IGNORE_DIRECTORIES && this.#IGNORE_DIRECTORY_NAMES.includes(dirName)) {
          this.debug(`---IGNORING DIRECTORY "${dirName}"`);
          delete fsbDirStats[dirName];
        }
      }
    }

    const headerItemUI = this.#buildDirectoryListHeaderUI();
    domDirectoryList.append(headerItemUI);

    if (Object.keys(fsbDirStats).length < 1) { // DO THIS AGAIN AFTER REMOVAL OF ANY IGNORED DIRECTORY NAMES
      this.error("---fsbDirStats.length < 1");
      this.#setErrorFor("fsbStorageManagerTitlePanel", "fsbStorageManager_error_noDirectories");
      return;

    } else {
      const installedExtensions = await messenger.management.getAll();
      const sortedKeys          = Object.keys(fsbDirStats).sort( (a, b) => { return a.localeCompare( b, undefined, {'sensitivity': 'base'} ) } );

      for (const key of sortedKeys) {
        const dirStats = fsbDirStats[key];
        var   extensionInfo
        var   extProps

        if (installedExtensions) {
          extensionInfo = installedExtensions.find( extension =>
            {
              return (extension.type === 'extension' && extension.id === dirStats.dirName);
            }
          );
          this.debug("---extensionInfo\n", extensionInfo);
        }

        if (! extensionInfo) {
          this.debug("---NO extensionInfo");
        } else {
          this.debug("\n---extensionInfo:\n", extensionInfo);
        }

        if (allExtensionsProps) {
          extProps = (allExtensionsProps && dirStats.dirName in allExtensionsProps) ? allExtensionsProps[dirStats.dirName] : null;
        }

        if (! extProps) {
          this.debug("---NO extensionProps");
        } else {
          this.debug("\n---extProps:\n", extProps);
        }

        const listItemUI = await this.#buildDirectoryListItemUI(dirStats, extensionInfo, extProps);
        domDirectoryList.append(listItemUI);
      }
    }
  }



  #buildDirectoryListHeaderUI() {
    this.debug("-- BUILD LIST HEADER UI");

    const dirHeaderTR = document.createElement("tr");
      dirHeaderTR.classList.add("directory-list-header"); // directory-list-header

      // Create Controls element and add it to the row
      const controlsTH = document.createElement("th");
        controlsTH.classList.add("list-header-controls");  // directory-list-header > list-header-controls
        const controlsDiv = document.createElement("div");
          controlsDiv.classList.add("header-controls");  // directory-list-header > list-header-controls > header-controls
        controlsTH.appendChild(controlsDiv);
      dirHeaderTR.appendChild(controlsTH);

      // Create Directory Name element and add it to the row
      const dirNameTH = document.createElement("th");
        dirNameTH.classList.add("list-header-data");  // directory-list-header > list-header-data
        dirNameTH.classList.add("header-name");       // directory-list-header > header-name

    this.#resetMessages();
    this.#resetErrors();
        dirNameTH.appendChild( document.createTextNode(this.#listHeaderText_dirName) );
        dirNameTH.setAttribute("title", this.#listHeaderTooltip_dirName);
      dirHeaderTR.appendChild(dirNameTH);

      // Create Extension ID element and add it to the row
      const extIdTH = document.createElement("th");
        extIdTH.classList.add("list-header-data");  // directory-list-header > list-header-data
        extIdTH.classList.add("header-ext-id");    // directory-list-header > header-ext-id
        extIdTH.appendChild( document.createTextNode(this.#listHeaderText_extensionId) );
        extIdTH.setAttribute("title", this.#listHeaderTooltip_extensionId);
      dirHeaderTR.appendChild(extIdTH);

      // Create Extension Installed element and add it to the row
      const extInstalledTH = document.createElement("th");
        extInstalledTH.classList.add("list-header-data");      // directory-list-header > list-header-data
        extInstalledTH.classList.add("header-ext-installed");  // directory-list-header > header-ext-installed
        extInstalledTH.appendChild( document.createTextNode(this.#listHeaderText_extensionInstalled) );
        extInstalledTH.setAttribute("title", this.#listHeaderTooltip_extensionInstalled);
      dirHeaderTR.appendChild(extInstalledTH);

      // Create Extension Enabled element and add it to the row
      const extEnabledTH = document.createElement("th");
        extEnabledTH.classList.add("list-header-data");     // directory-list-header > list-header-data
        extEnabledTH.classList.add("header-ext-enabled");  // directory-list-header > header-ext-enabled
        extEnabledTH.appendChild( document.createTextNode(this.#listHeaderText_extensionEnabled) );
        extEnabledTH.setAttribute("title", this.#listHeaderTooltip_extensionEnabled);
      dirHeaderTR.appendChild(extEnabledTH);

      // Create Extension Configured element and add it to the row
      const extConfiguredTH = document.createElement("th");
        extConfiguredTH.classList.add("list-header-data");            // directory-list-header > list-header-data
        extConfiguredTH.classList.add("header-ext-configured");       // directory-list-header > header-ext-configured
        extConfiguredTH.appendChild( document.createTextNode(this.#listHeaderText_extensionConfigured) );
        extConfiguredTH.setAttribute("title", this.#listHeaderTooltip_extensionConfigured);
      dirHeaderTR.appendChild(extConfiguredTH);

      // Create Extension Access Allowed element and add it to the row
      const extAccessAllowedTH = document.createElement("th");
        extAccessAllowedTH.classList.add("list-header-data");         // directory-list-header > list-header-data
        extAccessAllowedTH.classList.add("header-ext-access");        // directory-list-header > header-ext-access
        extAccessAllowedTH.appendChild( document.createTextNode(this.#listHeaderText_extensionAccessAllowed) );
        extAccessAllowedTH.setAttribute("title", this.#listHeaderTooltip_extensionAccessAllowed);
      dirHeaderTR.appendChild(extAccessAllowedTH);

      // Create Extension Read-Only element and add it to the row
      const extReadOnlyTH = document.createElement("th");
        extReadOnlyTH.classList.add("list-header-data");      // directory-list-header > list-header-data
        extReadOnlyTH.classList.add("header-ext-read-only");  // directory-list-header > header-ext-read-only
        extReadOnlyTH.appendChild( document.createTextNode(this.#listHeaderText_extensionReadOnly) );
        extReadOnlyTH.setAttribute("title", this.#listHeaderTooltip_extensionReadOnly);
      dirHeaderTR.appendChild(extReadOnlyTH);

      // Create Extension Special element and add it to the row
      const extSpecialTH = document.createElement("th");
        extSpecialTH.classList.add("list-header-data");               // directory-list-header > list-header-data
        extSpecialTH.classList.add("header-ext-special");             // directory-list-header > header-ext-special
        extSpecialTH.appendChild( document.createTextNode(this.#listHeaderText_extensionSpecial) );
        extSpecialTH.setAttribute("title", this.#listHeaderTooltip_extensionSpecial);
      dirHeaderTR.appendChild(extSpecialTH);

      // Create Extension Locked element and add it to the row
      const extLockedTH = document.createElement("th");
        extLockedTH.classList.add("list-header-data");                // directory-list-header > list-header-data
        extLockedTH.classList.add("header-ext-locked");               // directory-list-header > header-ext-locked
        extLockedTH.appendChild( document.createTextNode(this.#listHeaderText_extensionLocked) );
        extLockedTH.setAttribute("title", this.#listHeaderTooltip_extensionLocked);
      dirHeaderTR.appendChild(extLockedTH);

      // Create Extension Directory-Protected element and add it to the row
      const extDirProtectTH = document.createElement("th");
        extDirProtectTH.classList.add("list-header-data");          // directory-list-header > list-header-data
        extDirProtectTH.classList.add("header-ext-dir-protect");    // directory-list-header > header-ext-dir-protect
        extDirProtectTH.appendChild( document.createTextNode(this.#listHeaderText_extensionDirProtect) );
        extDirProtectTH.setAttribute("title", this.#listHeaderTooltip_extensionDirProtect);
      dirHeaderTR.appendChild(extDirProtectTH);

      // Create Item Count element and add it to the row
      const itemCountTH = document.createElement("th");
        itemCountTH.classList.add("list-header-data");    // directory-list-header > list-header-data
        itemCountTH.classList.add("header-count-items");  // directory-list-header > header-count-items
        itemCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_items) );
        itemCountTH.setAttribute("title", this.#listHeaderTooltip_count_items);
      dirHeaderTR.appendChild(itemCountTH);

      // Create Item Type 'regular' Count element and add it to the row
      const regularCountTH = document.createElement("th");
        regularCountTH.classList.add("list-header-data");      // directory-list-header > list-header-data
        regularCountTH.classList.add("header-count-regular");  // directory-list-header > header-count-regular
        regularCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_regular) );
        regularCountTH.setAttribute("title", this.#listHeaderTooltip_count_regular);
      dirHeaderTR.appendChild(regularCountTH);

      // Create Item Type 'directory' Count element and add it to the row
      const directoryCountTH = document.createElement("th");
        directoryCountTH.classList.add("list-header-data");        // directory-list-header > list-header-data
        directoryCountTH.classList.add("header-count-directory");  // directory-list-header > header-count-directory
        directoryCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_directory) );
        directoryCountTH.setAttribute("title", this.#listHeaderTooltip_count_directory);
      dirHeaderTR.appendChild(directoryCountTH);

      // Create Item Type 'other' Count element and add it to the row
      const otherCountTH = document.createElement("th");
        otherCountTH.classList.add("list-header-data");    // directory-list-header > list-header-data
        otherCountTH.classList.add("header-count-other");  // directory-list-header > header-count-other
        otherCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_other) );
        otherCountTH.setAttribute("title", this.#listHeaderTooltip_count_other);
      dirHeaderTR.appendChild(otherCountTH);

      // Create Item Type unknown Count element and add it to the row
      const unknownCountTH = document.createElement("th");
        unknownCountTH.classList.add("list-header-data");      // directory-list-header > list-header-data
        unknownCountTH.classList.add("header-count-unknown");  // directory-list-header > header-count-unknown
        unknownCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_unknown) );
        unknownCountTH.setAttribute("title", this.#listHeaderTooltip_count_unknown);
      dirHeaderTR.appendChild(unknownCountTH);

      // Create Item Type error Count element and add it to the row
      const errorCountTH = document.createElement("th");
        errorCountTH.classList.add("list-header-data");    // directory-list-header > list-header-data
        errorCountTH.classList.add("header-count-error");  // directory-list-header > header-count-error
        errorCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_error) );
        errorCountTH.setAttribute("title", this.#listHeaderTooltip_count_error);
      dirHeaderTR.appendChild(errorCountTH);

      // Create Smallest Size element and add it to the row
      const sizeSmallestTH = document.createElement("th");
        sizeSmallestTH.classList.add("list-header-data");     // directory-list-header > list-header-data
        sizeSmallestTH.classList.add("header-size-smallest"); // directory-list-header > header-size-smallest
        sizeSmallestTH.appendChild( document.createTextNode(this.#listHeaderText_size_smallest) );
        sizeSmallestTH.setAttribute("title", this.#listHeaderTooltip_size_smallest);
      dirHeaderTR.appendChild(sizeSmallestTH);

      // Create Largest Size element and add it to the row
      const sizeLargestTH = document.createElement("th");
        sizeLargestTH.classList.add("list-header-data");     // directory-list-header > list-header-data
        sizeLargestTH.classList.add("header-size-largest");  // directory-list-header > header-size-largest
        sizeLargestTH.appendChild( document.createTextNode(this.#listHeaderText_size_largest) );
        sizeLargestTH.setAttribute("title", this.#listHeaderTooltip_size_largest);
      dirHeaderTR.appendChild(sizeLargestTH);

      // Create Total Size element and add it to the row
      const sizeTotalTH = document.createElement("th");
        sizeTotalTH.classList.add("list-header-data");   // directory-list-header > list-header-data
        sizeTotalTH.classList.add("header-size-totel");  // directory-list-header > header-size-totel
        sizeTotalTH.appendChild( document.createTextNode(this.#listHeaderText_size_total) );
        sizeTotalTH.setAttribute("title", this.#listHeaderTooltip_size_total);
      dirHeaderTR.appendChild(sizeTotalTH);

      // Create Earliest Creation Time element and add it to the row
      const timeCreationEarliestTH = document.createElement("th");
        timeCreationEarliestTH.classList.add("list-header-data");               // directory-list-header > list-header-data
        timeCreationEarliestTH.classList.add("header-time-creation-earliest");  // directory-list-header > header-time-creation-earliest
        timeCreationEarliestTH.appendChild( document.createTextNode(this.#listHeaderText_time_creation_earliest) );
        timeCreationEarliestTH.setAttribute("title", this.#listHeaderTooltip_time_creation_earliest);
      dirHeaderTR.appendChild(timeCreationEarliestTH);

      // Create Latest Creation Time element and add it to the row
      const timeCreationLatestTH = document.createElement("th");
        timeCreationLatestTH.classList.add("list-header-data");             // directory-list-header > list-header-data
        timeCreationLatestTH.classList.add("header-time-creation-latest");  // directory-list-header > header-time-creation-latest
        timeCreationLatestTH.appendChild( document.createTextNode(this.#listHeaderText_time_creation_latest) );
        timeCreationLatestTH.setAttribute("title", this.#listHeaderTooltip_time_creation_latest);
      dirHeaderTR.appendChild(timeCreationLatestTH);

      // Create Earliest Last Accessed Time element and add it to the row
      const timeLastAccessedEarliestTH = document.createElement("th");
        timeLastAccessedEarliestTH.classList.add("list-header-data");                     // directory-list-header > list-header-data
        timeLastAccessedEarliestTH.classList.add("header-time-last-accessed-earliest");   // directory-list-header > header-time-last-accessed-earliest
        timeLastAccessedEarliestTH.appendChild( document.createTextNode(this.#listHeaderText_time_lastAccessed_earliest) );
        timeLastAccessedEarliestTH.setAttribute("title", this.#listHeaderTooltip_time_lastAccessed_earliest);
      dirHeaderTR.appendChild(timeLastAccessedEarliestTH);

      // Create Latest Last Accessed Time element and add it to the row
      const timeLastAccessedLatestTH = document.createElement("th");
        timeLastAccessedLatestTH.classList.add("list-header-data");                  // directory-list-header > list-header-data
        timeLastAccessedLatestTH.classList.add("header-time-last-accessed-latest");  // directory-list-header > header-time-last-accessed-latest
        timeLastAccessedLatestTH.appendChild( document.createTextNode(this.#listHeaderText_time_lastAccessed_latest) );
        timeLastAccessedLatestTH.setAttribute("title", this.#listHeaderTooltip_time_lastAccessed_latest);
      dirHeaderTR.appendChild(timeLastAccessedLatestTH);

      // Create Earliest Last Modified Time element and add it to the row
      const timeLastModifiedEarliestTH = document.createElement("th");
        timeLastModifiedEarliestTH.classList.add("list-header-data");                    // directory-list-header > list-header-data
        timeLastModifiedEarliestTH.classList.add("header-time-last-modified-earliest");  // directory-list-header > header-time-last-modified-earliest
        timeLastModifiedEarliestTH.appendChild( document.createTextNode(this.#listHeaderText_time_lastModified_earliest) );
        timeLastModifiedEarliestTH.setAttribute("title", this.#listHeaderTooltip_time_lastModified_earliest);
      dirHeaderTR.appendChild(timeLastModifiedEarliestTH);

      // Create Latest Last Modified Time element and add it to the row
      const timeLastModifiedLatestTH = document.createElement("th");
        timeLastModifiedLatestTH.classList.add("list-header-data");                  // directory-list-header > list-header-data
        timeLastModifiedLatestTH.classList.add("header-time-last-modified-latest");  // directory-list-header > header-time-last-modified-latest
        timeLastModifiedLatestTH.appendChild( document.createTextNode(this.#listHeaderText_time_lastModified_latest) );
        timeLastModifiedLatestTH.setAttribute("title", this.#listHeaderTooltip_time_lastModified_latest);
      dirHeaderTR.appendChild(timeLastModifiedLatestTH);

    return dirHeaderTR;
  }



  // async just because of formatFileSize()
  async #buildDirectoryListItemUI(dirStats, extensionInfo, extProps) {
    /* if extensionInfo (management.ExtensionInfo) is not null, it means an extension is installed whose ID matches dirStats.dirName
     *
     * If extnesionProps (see class FsbOptions) is not null, it means and extension is configured whose ID matches dirStats.dirName
     *
     * dirStats:
     *   {
     *     'dirName':                         string:   directory fileName
     *     'dirPath':                         string:   directory full pathName
     *     'isFileSystemRoot':                boolean:  true if this is the FileSystemBroker Root Directory
     *     'error':                           string:   a description if there was an error getting information. None of the data below will be present.
     *     'count_children':                  integer:  total number of child items
     *     'count_type_regular':              integer:  number of child items with type 'regular'
     *     'count_type_directory':            integer:  number of child items with type 'directory'
     *     'count_type_other':                integer:  number of child items with type 'other'
     *     'count_type_unknown':              integer:  number of child items whose type is none of the three above
     *     'count_type_error':                integer:  number of child items whose type could not be determined
     *     'time_fileCreation_earliest':      integer:  earliest Creation      Time in MS (OS-dependent) of all Regular File child items (undefined if no children)
     *     'time_fileCreation_latest':        integer:  latest   Creation      Time in MS (OS-dependent) of all Regular File child items (undefined if no children)
     *     'time_fileLastAccessed_earliest':  integer:  earliest Last Accessed Time in MS (OS-dependent) of all Regular File child items (undefined if no children)
     *     'time_fileLastAccessed_latest':    integer:  latest   Last Accessed Time in MS (OS-dependent) of all Regular File child items (undefined if no children)
     *     'time_fileLastModified_earliest':  integer:  earliest Last Modified Time in MS (OS-dependent) of all Regular File child items (undefined if no children)
     *     'time_fileLastModified_latest':    integer:  latest   Last Modified Time in MS (OS-dependent) of all Regular File child items (undefined if no children)
     *     'size_smallest':                   integer:  smallest size  (bytes) of all child items with type 'regular' (undefined if none, i.e. count_type_regular = 0)
     *     'size_largest':                    integer:  largest  size  (bytes) of all child items with type 'regular' (undefined if none, i.e. count_type_regular = 0)
     *     'size_total':                      integer:  total of sizes (bytes) of all child items with type 'regular' (0 if none, i.e. count_type_regular = 0)
     *   }
     */
    this.debug(`BUILD DIRECTORY LIST ITEM UI: --- \n--dirStats:\n`, dirStats, "\n--extensionInfo:\n", extensionInfo, "\n--extProps:\n", extProps);

    const dirItemTR = document.createElement("tr");
      dirItemTR.classList.add("directory-list-item");                          // directory-list-item

      const dirName            = dirStats.dirName;
      const dirPath            = dirStats.dirPath;
      const isFileSystemRoot   = dirStats.isFileSystemRoot;
      const itemCount          = dirStats.count_children;
      const fileCount          = dirStats.count_regular;
      const installed          = ! isFileSystemRoot          && ( extensionInfo  !== undefined && extensionInfo  !== null     );
      const enabled            = ! isFileSystemRoot          && ( installed                    && ! extensionInfo.disabled    );
      const configured         = ! isFileSystemRoot          && ( extProps       !== undefined && extProps !== null           );
      const special            = isFileSystemRoot ||            ( configured                   && extProps.special            );
      const locked             = isFileSystemRoot || special || ( configured                   && extProps.locked             );
      const dirProtect         = isFileSystemRoot || special || ( configured                   && extProps.dirProtect         );
      const allowAccess        =                                ( configured                   && extProps.allowAccess        );
      const readOnly           = allowAccess    && ! special && ( configured                   && extProps.readOnly           );
      const noQuota            = ! configured     || special || ( configured                   && extProps.noQuota            );
      const overStorageQuota   = ! noQuota                   && ( configured                   && extProps.overStorageQuota   );
      const overFileSizeQuota  = ! noQuota                   && ( configured                   && extProps.overFileSizeQuota  );
      const overFileCountQuota = ! noQuota                   && ( configured                   && extProps.overFileCountQuota );
      const overAnyQuota       = overStorageQuota || overFileSizeQuota || overFileCountQuota;

      const extId              = installed  ? extensionInfo.id : undefined;
      const propsExtId         = configured ? extProps.id      : undefined;

      if (extId !== undefined && propsExtId !== undefined && extId !== propsExtId) {
        this.error(`exitId !== propsExtId: "${extId}" !== "${propsExtId}"`);
      }

                      dirItemTR.setAttribute( "dirName",   dirName    );
      if (propsExtId) dirItemTR.setAttribute( "extId",     propsExtId );
                      dirItemTR.setAttribute( "dirPath",   dirPath    );
                      dirItemTR.setAttribute( "itemCount", itemCount  );
                      dirItemTR.setAttribute( "fileCount", fileCount  );

      if ( isFileSystemRoot ) dirItemTR.classList.add( "file-system-root" );
      if ( installed        ) dirItemTR.classList.add( "installed"        );
      if ( enabled          ) dirItemTR.classList.add( "enabled"          );
      if ( configured       ) dirItemTR.classList.add( "configured"       );
      if ( special          ) dirItemTR.classList.add( "special"          );
      if ( locked           ) dirItemTR.classList.add( "locked"           );
      if ( dirProtect       ) dirItemTR.classList.add( "dir-protect"      );
      if ( allowAccess      ) dirItemTR.classList.add( "allow-access"     );
      if ( readOnly         ) dirItemTR.classList.add( "read-only"        );
      if ( noQuota          ) dirItemTR.classList.add( "no-quota"         );
      if ( overAnyQuota     ) dirItemTR.classList.add( "over-quota"       );

      dirItemTR.addEventListener("click", (e) => this.#directoryListItemClicked(e));

      // Create Controls element and add it to the row
      { const controlsTD = document.createElement("td");
          controlsTD.classList.add("list-item-controls");                        // directory-list-item > list-item-controls
          const controlsDiv = document.createElement("div");
            controlsDiv.classList.add("item-controls-panel");                    // directory-list-item > list-item-controls > item-controls-panel

            const deleteDirectoryButton = document.createElement("button");
              deleteDirectoryButton.classList.add( "item-controls-button"    ); // directory-list-item > list-item-controls > item-controls-panel > item-controls-button
              deleteDirectoryButton.classList.add( "extension-icon-button"   ); // directory-list-item > list-item-controls > item-controls-panel > extension-icon-button
              deleteDirectoryButton.classList.add( "icon-button"             ); // directory-list-item > list-item-controls > item-controls-panel > icon-button
              deleteDirectoryButton.classList.add( "icon-only"               ); // directory-list-item > list-item-controls > item-controls-panel > icon-only
              deleteDirectoryButton.classList.add( "button-delete-directory" ); // directory-list-item > list-item-controls > item-controls-panel > button-delete-directory
              deleteDirectoryButton.setAttribute( "dirName", dirName );
              deleteDirectoryButton.setAttribute( "dirPath", dirPath );
              if (isFileSystemRoot) {
                deleteDirectoryButton.disabled = true;
                deleteDirectoryButton.setAttribute(   "title", this.#listItemTooltip_deleteDirButton_fileSysRoot   );
              } else {
                if (special) {
                  deleteDirectoryButton.setAttribute( "title", this.#listItemTooltip_deleteDirButton_extSpecial    );
                } else if (dirProtect) {
                  deleteDirectoryButton.setAttribute( "title", this.#listItemTooltip_deleteDirButton_extDirProtect );
                } else {
                  deleteDirectoryButton.setAttribute( "title", this.#listItemTooltip_deleteDirButton_enabled       );
                }
                deleteDirectoryButton.disabled = false;
                deleteDirectoryButton.addEventListener("click", (e) => this.#directoryListItemControlClicked(e));
              }
            controlsDiv.appendChild(deleteDirectoryButton);

            const resetQuotasButton = document.createElement("button");
              resetQuotasButton.setAttribute("extId", propsExtId);
              resetQuotasButton.classList.add( "item-controls-button"    );   // directory-list-item > list-item-controls > item-controls-panel > item-controls-button
              resetQuotasButton.classList.add( "extension-icon-button"   );   // directory-list-item > list-item-controls > item-controls-panel > extension-icon-button
              resetQuotasButton.classList.add( "icon-button"             );   // directory-list-item > list-item-controls > item-controls-panel > icon-button
              resetQuotasButton.classList.add( "icon-only"               );   // directory-list-item > list-item-controls > item-controls-panel > icon-only
              resetQuotasButton.classList.add( "button-reset-ext-quotas" );   // directory-list-item > list-item-controls > item-controls-panel > button-reset-ext-quotas
              if (isFileSystemRoot) {
                resetQuotasButton.classList.add( "disabled-file-system-root" ); // directory-list-item > list-item-controls > item-controls-panel > disabled-file-system-root
                resetQuotasButton.setAttribute("title", this.#listItemTooltip_extQuotaButton_fileSystemRoot);
                resetQuotasButton.disabled = true;
              } else if (! configured) {
                resetQuotasButton.classList.add( "disabled-not-configured"   ); // directory-list-item > list-item-controls > item-controls-panel > disabled-not-configured
                resetQuotasButton.setAttribute("title", this.#listItemTooltip_extQuotaButton_notConfigured);
                resetQuotasButton.disabled = true;
              } else if (special) {
                resetQuotasButton.classList.add( "disabled-ext-special"      ); // directory-list-item > list-item-controls > item-controls-panel > disabled-ext-special
                resetQuotasButton.setAttribute("title", this.#listItemTooltip_extQuotaButton_extSpecial);
                resetQuotasButton.disabled = true;
              } else if (! propsExtId) {
                resetQuotasButton.classList.add( "disabled-no-ext-id"        ); // directory-list-item > list-item-controls > item-controls-panel > disabled-no-ext-id
                resetQuotasButton.setAttribute("title", this.#listItemTooltip_extQuotaButton_noQuotas);
                resetQuotasButton.disabled = true;
              } else {
                // following states can change, so we need the listener
                resetQuotasButton.addEventListener("click", (e) => this.#directoryListItemControlClicked(e));

                if (noQuota) {
                  resetQuotasButton.classList.add( "disabled-no-quota"       ); // directory-list-item > list-item-controls > item-controls-panel > disabled-no-quota
                  resetQuotasButton.setAttribute("title", this.#listItemTooltip_extQuotaButton_extNoQuotas);
                  resetQuotasButton.disabled = true;
                } else if (overAnyQuota) {
                  resetQuotasButton.setAttribute("title", this.#listItemTooltip_extQuotaButton_overQuotas);
                  resetQuotasButton.disabled = false;
                } else {
                  resetQuotasButton.classList.add( "disabled-not-over-quota" ); // directory-list-item > list-item-controls > item-controls-panel > disabled-not-over-quota
                  resetQuotasButton.setAttribute("title", this.#listItemTooltip_extQuotaButton_notOverQuotas);
                  resetQuotasButton.disabled = true;
                }
              }
            controlsDiv.appendChild(resetQuotasButton);

          controlsTD.appendChild(controlsDiv);
        dirItemTR.appendChild(controlsTD);
      }



      // Create Directory Name element and add it to the row
      { const dirNameTD = document.createElement("td");
          dirNameTD.classList.add("list-item-data"     ); // directory-list-item > list-item-data
          dirNameTD.classList.add("data-text"          ); // directory-list-item > data-text
          dirNameTD.classList.add("list-item-dir-name" ); // directory-list-item > list-item-dir-name
          if (dirStats.dirName) {
            const dirNameTextSpan = document.createElement("span");
              dirNameTextSpan.classList.add( "data-text-text" ); // directory-list-item > data-text-text
              dirNameTextSpan.classList.add( "dir-name-text"  ); // directory-list-item > dir-name-text
              dirNameTextSpan.appendChild( document.createTextNode(dirStats.dirName) );
            dirNameTD.appendChild(dirNameTextSpan);
          }
        dirItemTR.appendChild(dirNameTD);
      }

      // Create Extension ID element and add it to the row
      { const extIdTD = document.createElement("td");
          extIdTD.classList.add( "list-item-data"   ); // directory-list-item > list-item-data
          extIdTD.classList.add( "data-text"        ); // directory-list-item > data-text
          extIdTD.classList.add( "list-item-ext-id" ); // directory-list-item > list-item-ext-id
          if (! isFileSystemRoot && extensionInfo && extensionInfo.id) {
            const exitIdTextSpan = document.createElement("span");
              exitIdTextSpan.classList.add( "data-text-text" ); // directory-list-item > data-text-text
              exitIdTextSpan.classList.add( "ext-id-text"    ); // directory-list-item > ext-id-text
              exitIdTextSpan.appendChild( document.createTextNode(extensionInfo.id) );
            extIdTD.appendChild(exitIdTextSpan);
          }
        dirItemTR.appendChild(extIdTD);
      }



      // Create Extension Installed element and add it to the row
      { const extInstalledTD = document.createElement("td");
          extInstalledTD.classList.add( "list-item-data"          ); // directory-list-item > list-item-data
          extInstalledTD.classList.add( "data-boolean"            ); // directory-list-item > data-boolean
          extInstalledTD.classList.add( "data-boolean-icon"       ); // directory-list-item > data-boolean-icon
          extInstalledTD.classList.add( "list-item-ext-installed" ); // directory-list-item > list-item-ext-installed
          if (! isFileSystemRoot) {
            const extInstalledIconSpan = document.createElement("span");
              extInstalledIconSpan.classList.add("boolean-icon");
              if (installed) {
                extInstalledIconSpan.classList.add("icon-ext-installed");
                extInstalledTD.setAttribute("title", this.#listItemTooltip_extInstalled);
              } else {
                extInstalledIconSpan.classList.add("icon-ext-not-installed");
                extInstalledTD.setAttribute("title", this.#listItemTooltip_extNotInstalled);
              }
            extInstalledTD.appendChild(extInstalledIconSpan);
          }
        dirItemTR.appendChild(extInstalledTD);
      }

      // Create Extension Enabled element and add it to the row
      { const extEnabledTD = document.createElement("td");
          extEnabledTD.classList.add( "list-item-data"        ); // directory-list-item > list-item-data
          extEnabledTD.classList.add( "data-boolean"          ); // directory-list-item > data-boolean
          extEnabledTD.classList.add( "data-boolean-dot"      ); // directory-list-item > data-boolean-dot
          extEnabledTD.classList.add( "list-item-ext-enabled" ); // directory-list-item > list-item-ext-enabled
          if (! isFileSystemRoot) {
            const extEnabledDotSpan = document.createElement("span");
              extEnabledDotSpan.classList.add("boolean-dot");
              if (installed) {
                if (extensionInfo.disabled) {
                  extEnabledDotSpan.classList.add("dot-ext-disabled");
                  extEnabledTD.setAttribute("title", this.#listItemTooltip_extDisabled);
                } else {
                  extEnabledDotSpan.classList.add("dot-ext-enabled");
                  extEnabledTD.setAttribute("title", this.#listItemTooltip_extEnabled);
                }
              } else {
                extEnabledDotSpan.classList.add("dot-ext-disabled-not-installed");
              }
            extEnabledTD.appendChild(extEnabledDotSpan);
          }
        dirItemTR.appendChild(extEnabledTD);
      }

      // Create Extension Configured element and add it to the row
      { const extConfiguredTD = document.createElement("td");
          extConfiguredTD.classList.add( "list-item-data"           ); // directory-list-item > list-item-data
          extConfiguredTD.classList.add( "data-boolean"             ); // directory-list-item > data-boolean
          extConfiguredTD.classList.add( "data-boolean-dot"         ); // directory-list-item > data-boolean-dot
          extConfiguredTD.classList.add( "list-item-ext-configured" ); // directory-list-item > list-item-ext-configured
          if (! isFileSystemRoot) {
            const extConfiguredDotSpan = document.createElement("span");
              extConfiguredDotSpan.classList.add("boolean-dot");
              if (configured) {
                extConfiguredDotSpan.classList.add("dot-ext-configured");
                extConfiguredTD.setAttribute("title", this.#listItemTooltip_extConfigured);
              } else {
                extConfiguredDotSpan.classList.add("dot-ext-not-configured");
                extConfiguredTD.setAttribute("title", this.#listItemTooltip_extNotConfigured);
              }
            extConfiguredTD.appendChild(extConfiguredDotSpan);
          }
        dirItemTR.appendChild(extConfiguredTD);
      }

      // Create Extension Access Allowed element and add it to the row
      { const extAccessAllowedTD = document.createElement("td");
          extAccessAllowedTD.classList.add( "list-item-data"             ); // directory-list-item > list-item-data
          extAccessAllowedTD.classList.add( "data-boolean"               ); // directory-list-item > data-boolean
          extAccessAllowedTD.classList.add( "data-boolean-icon"          ); // directory-list-item > data-boolean-icon
          extAccessAllowedTD.classList.add( "list-item-ext-allow-access" ); // directory-list-item > list-item-ext-allow-access
          if (! isFileSystemRoot) {
            const extAccessAllowedIconSpan = document.createElement("span");
              extAccessAllowedIconSpan.classList.add("boolean-icon");
              if (configured) {
                if (allowAccess) {
                  extAccessAllowedIconSpan.classList.add("icon-ext-access-allowed");
                  extAccessAllowedTD.setAttribute("title", this.#listItemTooltip_extAccessAllowed);
                } else {
                  extAccessAllowedIconSpan.classList.add("icon-ext-access-denied");
                  extAccessAllowedTD.setAttribute("title", this.#listItemTooltip_extNotAccessAllowed);
                }
              } else {
                extAccessAllowedIconSpan.classList.add("icon-ext-access-not-configured");
              }
            extAccessAllowedTD.appendChild(extAccessAllowedIconSpan);
          }
        dirItemTR.appendChild(extAccessAllowedTD);
      }

      // Create Extension Read-Only Access element and add it to the row
      { const extReadOnlyTD = document.createElement("td");
          extReadOnlyTD.classList.add( "list-item-data"          ); // directory-list-item > list-item-data
          extReadOnlyTD.classList.add( "data-boolean"            ); // directory-list-item > data-boolean
          extReadOnlyTD.classList.add( "data-boolean-icon"       ); // directory-list-item > data-boolean-icon
          extReadOnlyTD.classList.add( "list-item-ext-read-only" ); // directory-list-item > list-item-ext-read-only
          const extReadOnlyIconSpan = document.createElement("span");
            extReadOnlyIconSpan.classList.add("boolean-icon");
            if (configured) {
              if (allowAccess) {
                if (readOnly) {
                  extReadOnlyIconSpan.classList.add("icon-ext-read-only");
                  extReadOnlyTD.setAttribute("title", this.#listItemTooltip_extReadOnly);
                } else {
                  extReadOnlyIconSpan.classList.add("icon-ext-not-read-only");
                  extReadOnlyTD.setAttribute("title", this.#listItemTooltip_extNotReadOnly);
                }
              } else {
                extReadOnlyIconSpan.classList.add("icon-ext-not-read-only-access-denied");
                extReadOnlyTD.setAttribute("title", this.#listItemTooltip_extNotReadOnly_notAccessAllowed);
              }
            } else {
              extReadOnlyIconSpan.classList.add("icon-ext-not-read-only-not-configured");
              extReadOnlyTD.setAttribute("title", this.#listItemTooltip_extNotReadOnly_notConfigured);
            }
          extReadOnlyTD.appendChild(extReadOnlyIconSpan);
        dirItemTR.appendChild(extReadOnlyTD);
      }

      // Create Extension Special element and add it to the row
      { const extSpecialTD = document.createElement("td");
          extSpecialTD.classList.add( "list-item-data"        ); // directory-list-item > list-item-data
          extSpecialTD.classList.add( "data-boolean"          ); // directory-list-item > data-boolean
          extSpecialTD.classList.add( "data-boolean-icon"     ); // directory-list-item > data-boolean-icon
          extSpecialTD.classList.add( "list-item-ext-special" ); // directory-list-item > list-item-special
          const extSpecialIconSpan = document.createElement("span");
            extSpecialIconSpan.classList.add("boolean-icon");
            if (isFileSystemRoot || configured) {
              if (isFileSystemRoot || special) {
                extSpecialIconSpan.classList.add("icon-ext-special");
                extSpecialTD.setAttribute("title", this.#listItemTooltip_extSpecial);
              } else {
                extSpecialIconSpan.classList.add("icon-ext-not-special");
                extSpecialTD.setAttribute("title", this.#listItemTooltip_extNotSpecial);
              }
            } else {
              extSpecialIconSpan.classList.add("icon-ext-special-not-configured");
            }
          extSpecialTD.appendChild(extSpecialIconSpan);
        dirItemTR.appendChild(extSpecialTD);
      }

      // Create Extension Locked element and add it to the row
      { const extLockedTD = document.createElement("td");
          extLockedTD.classList.add( "list-item-data"    ); // directory-list-item > list-item-data
          extLockedTD.classList.add( "data-boolean"      ); // directory-list-item > data-boolean
          extLockedTD.classList.add( "data-boolean-icon" ); // directory-list-item > data-boolean-icon
          extLockedTD.classList.add( "list-item-locked"  ); // directory-list-item > list-item-locked
          const extLockedIconSpan = document.createElement("span");
            extLockedIconSpan.classList.add("boolean-icon");
            if (isFileSystemRoot || configured) {
              if (isFileSystemRoot || locked) {
                extLockedIconSpan.classList.add("icon-ext-locked");
                extLockedTD.setAttribute("title", this.#listItemTooltip_extLocked);
              } else {
                extLockedIconSpan.classList.add("icon-ext-not-locked");
                extLockedTD.setAttribute("title", this.#listItemTooltip_extNotLocked);
              }
            } else {
              extLockedIconSpan.classList.add("icon-ext-locked-not-configured");
            }
          extLockedTD.appendChild(extLockedIconSpan);
        dirItemTR.appendChild(extLockedTD);
      }

      // Create Extension Directory Protected element and add it to the row
      { const extDirProtectTD = document.createElement("td");
          extDirProtectTD.classList.add( "list-item-data"            ); // directory-list-item > list-item-data
          extDirProtectTD.classList.add( "data-boolean"              ); // directory-list-item > data-boolean
          extDirProtectTD.classList.add( "data-boolean-icon"         ); // directory-list-item > data-boolean-icon
          extDirProtectTD.classList.add( "list-item-ext-dir-protect" ); // directory-list-item > list-item-ext-dir-protect
          const extDirProtectIconSpan = document.createElement("span");
            extDirProtectIconSpan.classList.add("boolean-icon");
            if (isFileSystemRoot || configured) {
              if (isFileSystemRoot || dirProtect) {
                extDirProtectIconSpan.classList.add("icon-ext-dir-protect");
                extDirProtectTD.setAttribute("title", this.#listItemTooltip_extDirProtect);
              } else {
                extDirProtectIconSpan.classList.add("icon-ext-not-dir-protect");
                extDirProtectTD.setAttribute("title", this.#listItemTooltip_extNotDirProtect);
              }
            } else {
              extDirProtectIconSpan.classList.add("icon-ext-dir-protect-not-configured");
            }
          extDirProtectTD.appendChild(extDirProtectIconSpan);
        dirItemTR.appendChild(extDirProtectTD);
      }



      // Create Child Count element and add it to the row
      { const countChildrenTD = document.createElement("td");
          countChildrenTD.classList.add( "list-item-data" ); // directory-list-item > list-item-data
          countChildrenTD.classList.add( "data-count"     ); // directory-list-item > data-count
          countChildrenTD.classList.add( "count-items"    ); // directory-list-item > count-items
          if (Number.isInteger(dirStats.count_children)) {
            countChildrenTD.setAttribute("title", this.#listHeaderTooltip_count_items);
            if (! noQuota && overFileCountQuota) {
              countChildrenTD.classList.add( "list-item-over-quota" ); // directory-list-item > list-item-over-quota
              countChildrenTD.classList.add( "marked-data"          ); // directory-list-item > marked-data
            }
            countChildrenTD.appendChild( document.createTextNode( dirStats.count_children ) ); // also const itemCount
          }
        dirItemTR.appendChild(countChildrenTD);
      }

      // Create Type Regular Count element and add it to the row
      { const countTypeRegularTD = document.createElement("td");
          countTypeRegularTD.classList.add( "list-item-data"     ); // directory-list-item > list-item-data
          countTypeRegularTD.classList.add( "data-count"         ); // directory-list-item > data-count
          countTypeRegularTD.classList.add( "count-type-regular" ); // directory-list-item > count-type-regular
          if (Number.isInteger(dirStats.count_type_regular)) {
            countTypeRegularTD.setAttribute("title", this.#listHeaderTooltip_count_regular);
            countTypeRegularTD.appendChild( document.createTextNode( dirStats.count_type_regular ) ); // also const fileCount
          }
        dirItemTR.appendChild(countTypeRegularTD);
      }

      // Create Type Directory Count element and add it to the row
      { const countTypeDirectoryTD = document.createElement("td");
          countTypeDirectoryTD.classList.add( "list-item-data"       ); // directory-list-item > list-item-data
          countTypeDirectoryTD.classList.add( "data-count"           ); // directory-list-item > data-count
          countTypeDirectoryTD.classList.add( "count-type-directory" ); // directory-list-item > count-type-directory
          if (Number.isInteger(dirStats.count_type_directory)) {
            countTypeDirectoryTD.setAttribute("title", this.#listHeaderTooltip_count_directory);
            if (! isFileSystemRoot && dirStats.count_type_directory > 0) {
              countTypeDirectoryTD.classList.add( "list-item-warning" ); // directory-list-item > list-item-warning
              countTypeDirectoryTD.classList.add( "marked-data"       ); // directory-list-item > marked-data
            }
            countTypeDirectoryTD.appendChild( document.createTextNode( dirStats.count_type_directory ) );
          }
        dirItemTR.appendChild(countTypeDirectoryTD);
      }

      // Create Type Other Count element and add it to the row
      { const countTypeOtherTD = document.createElement("td");
          countTypeOtherTD.classList.add( "list-item-data"   ); // directory-list-item > list-item-data
          countTypeOtherTD.classList.add( "data-count"       ); // directory-list-item > data-count
          countTypeOtherTD.classList.add( "count-type-other" ); // directory-list-item > count-type-other
          if (Number.isInteger(dirStats.count_type_other)) {
            countTypeOtherTD.setAttribute("title", this.#listHeaderTooltip_count_other);
            if (dirStats.count_type_other > 0) {
              countTypeOtherTD.classList.add( "list-item-caution" ); // directory-list-item > list-item-caution
              countTypeOtherTD.classList.add( "marked-data"       ); // directory-list-item > marked-data
            }
            countTypeOtherTD.appendChild( document.createTextNode( dirStats.count_type_other ) );
          }
        dirItemTR.appendChild(countTypeOtherTD);
      }

      // Create Type Unknown Count element and add it to the row
      { const countTypeUnknownTD = document.createElement("td");
          countTypeUnknownTD.classList.add( "list-item-data"     ); // directory-list-item > list-item-data
          countTypeUnknownTD.classList.add( "data-count"         ); // directory-list-item > data-count
          countTypeUnknownTD.classList.add( "count-type-unknown" ); // directory-list-item > count-type-unknown
          if (Number.isInteger(dirStats.count_type_unknown)) {
            countTypeUnknownTD.setAttribute("title", this.#listHeaderTooltip_count_unknown);
            if (dirStats.count_type_unknown > 0) {
              countTypeUnknownTD.classList.add( "list-item-caution" ); // directory-list-item > list-item-caution
              countTypeUnknownTD.classList.add( "marked-data"       ); // directory-list-item > marked-data
            }
            countTypeUnknownTD.appendChild( document.createTextNode( dirStats.count_type_unknown ) );
          }
        dirItemTR.appendChild(countTypeUnknownTD);
      }

      // Create Type Error Count element and add it to the row
      { const countTypeErrorTD = document.createElement("td");
          countTypeErrorTD.classList.add( "list-item-data"   ); // directory-list-item > list-item-data
          countTypeErrorTD.classList.add( "data-count"       ); // directory-list-item > data-count
          countTypeErrorTD.classList.add( "count-type-error" ); // directory-list-item > count-type-error
          if (Number.isInteger(dirStats.count_type_error)) {
            countTypeErrorTD.setAttribute("title", this.#listHeaderTooltip_count_error);
            if (dirStats.count_type_error > 0) {
              countTypeErrorTD.classList.add( "list-item-warning" ); // directory-list-item > list-item-warning
              countTypeErrorTD.classList.add( "marked-data"       ); // directory-list-item > marked-data
            }
            countTypeErrorTD.appendChild( document.createTextNode( dirStats.count_type_error ) );
          }
        dirItemTR.appendChild(countTypeErrorTD);
      }



      // Create Smallest Size element and add it to the row
      { const sizeSmallestTD = document.createElement("td");
          sizeSmallestTD.classList.add( "list-item-data" ); // directory-list-item > list-item-data
          sizeSmallestTD.classList.add( "data-size"      ); // directory-list-item > data-size
          sizeSmallestTD.classList.add( "size-smallest"  ); // directory-list-item > size-smallest
          if (Number.isInteger(dirStats.size_smallest)) {
            sizeSmallestTD.setAttribute("title", this.#listHeaderTooltip_size_smallest);
            sizeSmallestTD.appendChild( document.createTextNode( await messenger.messengerUtilities.formatFileSize(dirStats.size_smallest) ) );
          }
        dirItemTR.appendChild(sizeSmallestTD);
      }

      // Create Size element and add it to the row
      { const sizeLargestTD = document.createElement("td");
          sizeLargestTD.classList.add( "list-item-data" ); // directory-list-item > list-item-data
          sizeLargestTD.classList.add( "data-size"      ); // directory-list-item > data-size
          sizeLargestTD.classList.add( "size-largest"   ); // directory-list-item > size-largest
          if (Number.isInteger(dirStats.size_largest)) {
            sizeLargestTD.setAttribute("title", this.#listHeaderTooltip_size_largest);
            if (! noQuota && overFileSizeQuota) {
              sizeLargestTD.classList.add( "list-item-over-quota" ); // directory-list-item > list-item-over-quota
              sizeLargestTD.classList.add( "marked-data"          ); // directory-list-item > marked-data
            }
            sizeLargestTD.appendChild( document.createTextNode( await messenger.messengerUtilities.formatFileSize(dirStats.size_largest) ) );
          }
        dirItemTR.appendChild(sizeLargestTD);
      }

      // Create Size element and add it to the row
      { const sizeTotalTD = document.createElement("td");
          sizeTotalTD.classList.add( "list-item-data" ); // directory-list-item > list-item-data
          sizeTotalTD.classList.add( "data-size"      ); // directory-list-item > data-size
          sizeTotalTD.classList.add( "size-total"     ); // directory-list-item > size-total
          if (Number.isInteger(dirStats.size_total)) {
            sizeTotalTD.setAttribute("title", this.#listHeaderTooltip_size_total);
            if (! noQuota && overStorageQuota) {
              sizeTotalTD.classList.add( "list-item-over-quota" ); // directory-list-item > list-item-over-quota
              sizeTotalTD.classList.add( "marked-data"          ); // directory-list-item > marked-data
            }
            sizeTotalTD.appendChild( document.createTextNode( await messenger.messengerUtilities.formatFileSize(dirStats.size_total) ) );
          }
        dirItemTR.appendChild(sizeTotalTD);
      }



      // Create Earliest Child Creation Date/Time element and add it to the row
      { const timeEarliestChildCreationTD = document.createElement("td");
          timeEarliestChildCreationTD.classList.add( "list-item-data"               ); // directory-list-item > list-item-data
          timeEarliestChildCreationTD.classList.add( "data-time"                    ); // directory-list-item > data-time
          timeEarliestChildCreationTD.classList.add( "time-child-creation-earliest" ); // directory-list-item > time-child-creation-earliest
          if (Number.isInteger(dirStats.time_fileCreation_earliest)) {
            timeEarliestChildCreationTD.setAttribute("title", this.#listHeaderTooltip_time_creation_earliest);
            timeEarliestChildCreationTD.appendChild( document.createTextNode( utils.formatMsToDateTime24HR(dirStats.time_fileCreation_earliest) ) );
          }
        dirItemTR.appendChild(timeEarliestChildCreationTD);
      }

      // Create Latest Child Creation Date/Time element and add it to the row
      { const timeLatestChildCreationTD = document.createElement("td");
          timeLatestChildCreationTD.classList.add( "list-item-data"             ); // directory-list-item > list-item-data
          timeLatestChildCreationTD.classList.add( "data-time"                  ); // directory-list-item > data-time
          timeLatestChildCreationTD.classList.add( "time-child-creation-latest" ); // directory-list-item > time-child-creation-latest
          if (Number.isInteger(dirStats.time_fileCreation_latest)) {
            timeLatestChildCreationTD.setAttribute("title", this.#listHeaderTooltip_time_creation_latest);
            timeLatestChildCreationTD.appendChild( document.createTextNode( utils.formatMsToDateTime24HR(dirStats.time_fileCreation_latest) ) );
          }
        dirItemTR.appendChild(timeLatestChildCreationTD);
      }

      // Create Earliest Child Last Accessed Date/Time element and add it to the row
      { const timeEarliestChildLastAccessTD = document.createElement("td");
          timeEarliestChildLastAccessTD.classList.add( "list-item-data"                    ); // directory-list-item > list-item-data
          timeEarliestChildLastAccessTD.classList.add( "data-time"                         ); // directory-list-item > data-time
          timeEarliestChildLastAccessTD.classList.add( "time-child-last-accessed-earliest" ); // directory-list-item > time-child-last-accessed-earliest
          if (Number.isInteger(dirStats.time_fileLastAccessed_earliest)) {
            timeEarliestChildLastAccessTD.setAttribute("title", this.#listHeaderTooltip_time_lastAccessed_earliest);
            timeEarliestChildLastAccessTD.appendChild( document.createTextNode( utils.formatMsToDateTime24HR(dirStats.time_fileLastAccessed_earliest) ) );
          }
        dirItemTR.appendChild(timeEarliestChildLastAccessTD);
      }

      // Create Latest Child Last Accessed Date/Time element and add it to the row
      { const timeLatestChildLastAccessedTD = document.createElement("td");
          timeLatestChildLastAccessedTD.classList.add( "list-item-data"                  ); // directory-list-item > list-item-data
          timeLatestChildLastAccessedTD.classList.add( "data-time"                       ); // directory-list-item > data-time
          timeLatestChildLastAccessedTD.classList.add( "time-child-last-accessed-latest" ); // directory-list-item > time-child-last-accessed-latest
          if (Number.isInteger(dirStats.time_fileLastAccessedTime_latest)) {
            timeLatestChildLastAccessedTD.setAttribute("title", this.#listHeaderTooltip_time_lastAccessed_latest);
            timeLatestChildLastAccessedTD.appendChild( document.createTextNode( utils.formatMsToDateTime24HR(dirStats.time_fileLastAccessedTime_latest) ) );
          }
        dirItemTR.appendChild(timeLatestChildLastAccessedTD);
      }

      // Create Earliest Child Last Modified Date/Time element and add it to the row
      { const timeEarliestChildLastModifiedTD = document.createElement("td");
          timeEarliestChildLastModifiedTD.classList.add( "list-item-data"                    ); // directory-list-item > list-item-data
          timeEarliestChildLastModifiedTD.classList.add( "data-time"                         ); // directory-list-item > data-time
          timeEarliestChildLastModifiedTD.classList.add( "time-child-last-modified-earliest" ); // directory-list-item > time-child-last-modified-earliest
          if (Number.isInteger(dirStats.time_fileLastModified_earliest)) {
            timeEarliestChildLastModifiedTD.setAttribute("title", this.#listHeaderTooltip_time_lastModified_earliest);
            timeEarliestChildLastModifiedTD.appendChild( document.createTextNode( utils.formatMsToDateTime24HR(dirStats.time_fileLastModified_earliest) ) );
          }
        dirItemTR.appendChild(timeEarliestChildLastModifiedTD);
      }

      // Create Latest Child Last Modified Date/Time element and add it to the row
      { const timeLatestChildLastModifiedTD = document.createElement("td");
          timeLatestChildLastModifiedTD.classList.add( "list-item-data"                  ); // directory-list-item > list-item-data
          timeLatestChildLastModifiedTD.classList.add( "data-time"                       ); // directory-list-item > data-time
          timeLatestChildLastModifiedTD.classList.add( "time-child-last-modified-latest" ); // directory-list-item > time-child-last-modified-latest
          if (Number.isInteger(dirStats.time_fileLastModified_latest)) {
            timeLatestChildLastModifiedTD.setAttribute("title", this.#listHeaderTooltip_time_lastModified_latest);
            timeLatestChildLastModifiedTD.appendChild( document.createTextNode( utils.formatMsToDateTime24HR(dirStats.time_fileLastModified_latest) ) );
          }
        dirItemTR.appendChild(timeLatestChildLastModifiedTD);
      }

    return dirItemTR;
  }



  async #directoryListItemControlClicked(e) {
    this.debug("### CLICKED ###");

    this.#resetMessages();
    this.#resetErrors();

    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'LABEL') {
      this.debug("### CLICKED BUTTON OR LABEL ###");

      var button;
      if (e.target.tagName === 'BUTTON') {
        button = e.target;
      } else if (e.target.parentElement && e.target.parentElement.tagName === 'BUTTON') {
        button = e.target.parentElement;
      } else {
        this.debug("Got a click on a <label> whose parent element is not a <button>");
      }

      if (! button) {
        //
        this.debug("### CLICKED DIDN'T GET BUTTON ###");
      } else {
        e.preventDefault()

        if (button.classList.contains('item-controls-button')) {
          if (button.classList.contains('button-delete-directory')) {
            await this.#deleteDirectoryButtonClicked(button, e);
          } else if (button.classList.contains('button-reset-ext-quotas')) {
            await this.#resetExtQuotasButtonClicked(button, e);
          } else {
            this.error("'directory-list-item-button' Button does not have recognized button sub-class, classList:", button.classList);
          }
        } else {
          this.debug("Button does not have class 'directory-list-item-button':", button.classList);
        }
      }
    }
  }

  async #deleteDirectoryButtonClicked(button, e) {
    const dirName = button.getAttribute("dirName"); // or we could get this from the ancestor <tr>
    const dirPath = button.getAttribute("dirPath"); // or we could get this from the ancestor <tr>

    this.debug(`dirName="${dirName}" dirPath="${dirPath}"`);

    this.#resetMessages();
    this.#resetErrors();

    if (! dirName) {
      this.error("'button-delete-directory' Button does not have Attribute 'dirName'");
    } else if (! dirPath) {
      this.error("'button-delete-directory' Button does not have Attribute 'dirPath'");
    } else {
      await this.#deleteDirectory(dirName, dirPath);
    }
  }

  async #resetExtQuotasButtonClicked(button, e) {
    const extId = button.getAttribute("extId"); // or we could get propsExtId from the ancestor <tr>

    this.debug(`extId="${extId}"`);

    this.#resetMessages();
    this.#resetErrors();

    if (! extId) {
      this.error("'button-reset-ext-quotas' Button does not have Attribute 'extId'");
    } else {
      await this.#resetExtQuotas(extId);
    }
  }



  async #deleteDirectory(dirName, dirPath) {
    this.debug(`dirName="${dirName}" dirPath="${dirPath}"`);

    const dirItemSelector      = `tr.directory-list-item[dirName='${dirName}']`;
    const dirItemTR = document.querySelector(dirItemSelector);

    if (! dirItemTR) {
      this.error(`Failed to select Directory List Item TR with selector: "${dirItemSelector}"`);

    } else {
      this.debug("\n--- SELECTED TR:\n\n", dirItemTR, "\n\n");

      const uiError = false;
      if (dirItemTR.classList.contains("file-system-root")) {
        this.error(`ERROR: dirItemTR with selector="${dirItemSelector}" HAS CLASS 'file-system-root'`);
        this.#setErrorFor("fsbStorageManagerTitlePanel", "fsbStorageManager_error_deleteDirectory_fileSystemRoot");
        uiError = true;
//////} else if if (dirItemTR.classList.contains("special")) {
//////  this.error(`ERROR: dirItemTR with selector="${dirItemSelector}" HAS CLASS 'special'`);
//////  this.#setErrorFor("fsbStorageManagerTitlePanel", "fsbStorageManager_error_deleteDirectory_XXX");
//////  uiError = true;
      }

      if (uiError) {
        // already set error message
      } else {
        const itemCount        =                               dirItemTR.getAttribute("itemCount");
        const fileCount        =                               dirItemTR.getAttribute("fileCount");

        const isFileSystemRoot =                               dirItemTR.classList.contains( "file-system-root" );
        const installed        =                               dirItemTR.classList.contains( "installed"        );
        const enabled          = installed  &&                 dirItemTR.classList.contains( "enabled"          );
        const configured       =                               dirItemTR.classList.contains( "configured"       );
        const special          = configured &&                 dirItemTR.classList.contains( "special"          );
        const locked           = configured && ( special    || dirItemTR.classList.contains( "locked"           ) );
        const dirProtect       = configured && ( special    || dirItemTR.classList.contains( "dir-protect"      ) );
        const allowAccess      = configured &&                 dirItemTR.classList.contains( "allow-access"     );

        this.debug( `\n- isFileSystemRoot ... ${isFileSystemRoot}`,
                    `\n- itemCount .......... ${itemCount} type='${typeof itemCount}'`,
                    `\n- fileCount .......... ${fileCount} type='${typeof fileCount}'`,
                    `\n- installed .......... ${installed}`,
                    `\n- enabled ............ ${enabled}`,
                    `\n- configured ......... ${configured}`,
                    `\n- special ............ ${special}`,
                    `\n- locked ............. ${locked}`,
                    `\n- dirProtect ......... ${dirProtect}`,
                    `\n- allowAccess ........ ${allowAccess}`,
                  );

        if (isFileSystemRoot) { // recently added a check for this above
          this.error(`This directory is the FileSystemRoot and will NOT be deleted: dirName="${dirName}" dirPath="${dirPath}"`);

        } else {
          const confirmed = await this.#showDeleteDirectoryConfirmDialog( dirName,
                                                                          dirPath,
                                                                          itemCount,
                                                                          installed,
                                                                          enabled,
                                                                          configured,
                                                                          special,
                                                                          locked,
                                                                          dirProtect,
                                                                          allowAccess
                                                                        );

          if (! confirmed) {
            this.debug("The user chose to cancel directory deletion");
            this.#setMessageFor("fsbStorageManagerTitlePanel", "fsbStorageManager_message_deleteDirectory_canceled");

          } else {
            var   error    = false;
            var   deleted  = false;
            const response = await this.#fsBrokerApi.fsbDeleteDirectory( dirName, {'recursive': true} );

            if (! response) {
              this.error(`-- FAILED TO DELETE DIRECTORY -- NO RESPONSE RETURNED -- dirName="${dirName}"`);
              error = true;
            } else if (response.error) {
              this.error(`-- FAILED TO DELETE DIRECTORY -- ERROR RETURNED -- dirName="${dirName}": ${response.error}`);
              error = true;
            } else if (response.invalid) {
              this.error(`-- FAILED TO DELETE DIRECTORY -- INVALID RETURNED -- dirName="${dirName}": ${response.invalid}`);
              error = true;
            } else if (! response.directoryName) {
              this.error(`-- FAILED TO DELETE DIRECTORY -- NO DIRECTORY NAME RETURNED -- dirName="${dirName}": response.directoryName="${response.directoryName}"`);
              error = true;
            } else if (! response.deleted) {
              this.error(`-- FAILED TO DELETE DIRECTORY -- dirName="${dirName}" response.deleted="${response.deleted}"`);
              error = true;
            } else {
              this.debug(`-- Directory Deleted -- dirName="${dirName}": response.directoryName="${response.directoryName}"`);
              deleted = true;
              dirItemTR.remove();
            }

            if (error) {
              this.#setErrorFor("fsbStorageManagerTitlePanel", "fsbStorageManager_error_deleteDirectory_failed");
            }

            if (deleted) {
              this.#setMessageFor("fsbStorageManagerTitlePanel", "fsbStorageManager_message_deleteDirectory_success");
              await this.#updateFsbStatsUI();
            }
          }
        }
      }
    }
  }



  async #showDeleteDirectoryConfirmDialog(dirName, dirPath, numItems, installed, enabled, configured, special, locked, dirProtect, allowAccess) {
    const itemCount                = Number(numItems);
    const isExtensionInstalled     = (typeof installed   === 'boolean') ? installed    : false;
    const isExtensionEnabled       = (typeof enabled     === 'boolean') ? enabled      : false;
    const isExtensionConfigured    = (typeof configured  === 'boolean') ? configured   : false;
    const isExtensionSpecial       = (typeof special     === 'boolean') ? special      : false;
    const isExtensionLocked        = (typeof locked      === 'boolean') ? locked       : false;
    const isExtensionDirProtect    = (typeof dirProtect  === 'boolean') ? dirProtect : false;
    const isExtensionGrantedAccess = (typeof allowAccess === 'boolean') ? allowAccess  : false;

    this.debug( "\n--- parameters:",
                `\n- dirName .................... "${dirName}"`,
                `\n- dirPath .................... "${dirPath}"`,
                `\n- itemCount .................. ${itemCount}`,
                `\n- isExtensionInstalled ....... ${isExtensionInstalled}`,
                `\n- isExtensionEnabled ......... ${isExtensionEnabled}`,
                `\n- isExtensionConfigured ...... ${isExtensionConfigured}`,
                `\n- isExtensionSpecial ......... ${isExtensionSpecial}`,
                `\n- isExtensionLocked .......... ${isExtensionLocked}`,
                `\n- isExtensionDirProtect ...... ${isExtensionDirProtect}`,
                `\n- isExtensionGrantedAccess ... ${isExtensionGrantedAccess}`,
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

    const bounds = await this.#fsbOptionsApi.getWindowBounds("DeleteDirectoryConfirmDialog"); // MABXXX PERHAPS THIS SHOULD ALWAYS BE CENTERED??????

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

    // NOTE: ConfirmDialog title & messages are centered by default

    const title           = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_title");           // "Confirm Directory Deletion"
    const button1MsgId    = "fsbStorageManager_dialog_confirmDeleteDirectory_button_continue.label";
    const button2MsgId    = "fsbStorageManager_dialog_confirmDeleteDirectory_button_cancel.label";
    const messageContinue = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_messageContinue"); // "Do you wish to continue?"

    var  confirmDialogUrl = messenger.runtime.getURL("../dialogs/confirm.html")
                             + `?wn=${encodeURIComponent("DeleteDirectoryConfirmDialog")}`
                             + `&t=${encodeURIComponent(title)}`               // title
                             + `&tc=${encodeURIComponent('yellow')}`           // title color
                             + `&tw=${encodeURIComponent('bolder')}`           // title font-weight
                             + `&tts=${encodeURIComponent('1px 1px black')}`   // title text-shadow
                             + `&pb=${encodeURIComponent('#305050')}`          // messages panel background-color
                             + `&pbd=${encodeURIComponent('1px solid black')}` // messages panel border
                             + `&pbr=${encodeURIComponent('5px')}`             // messages panel border-radius
                             + `&pp=${encodeURIComponent('1em')}`              // messages panel padding
                             + `&pa=${encodeURIComponent('left')}`           // messages panel text-align
                             + "&b=2"                                          // button count
                             + `&bm1=${encodeURIComponent(button1MsgId)}`      // button 1 message ID
                             + `&bm2=${encodeURIComponent(button2MsgId)}`;     // button 2 message ID

    var msgNum  = 0;
    var message = '';

    message = utils.getI18nMsgSubst("fsbStorageManager_dialog_confirmDeleteDirectory_dirName", dirName);
    confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
    confirmDialogUrl += `&ma${msgNum}=${encodeURIComponent('center')}`
    confirmDialogUrl += `&mw${msgNum}=${encodeURIComponent('bold')}`

    confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(" ")}`

    // MABXXX USE UL (BULLET) ITEMS INSTEAD???

    if (! Number.isInteger(itemCount)) {
      // ???
    } else if (itemCount === 0) {
      message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_hasNoItems");
      confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
    } else if (itemCount === 1) {
      message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_hasOneItem");
      confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
      confirmDialogUrl += `&mc${msgNum}=${encodeURIComponent('yellow')}`
    } else {
      message = utils.getI18nMsgSubst("fsbStorageManager_dialog_confirmDeleteDirectory_hasNNItems", itemCount);
      confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
      confirmDialogUrl += `&mc${msgNum}=${encodeURIComponent('yellow')}`
    }

    confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(" ")}`

    if (isExtensionInstalled) {
      message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionInstalled");
      confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`

      if (isExtensionEnabled) {
        message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionEnabled");
        confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
      } else {
        message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionNotEnabled");
        confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
      }
    } else {
      message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionNotInstalled");
      confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
    }

    confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(" ")}`

    if (isExtensionConfigured) {
      message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionConfigured");
      confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`

      if (isExtensionSpecial) {
        message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionSpecial");
        confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&mw${msgNum}=${encodeURIComponent('bold')}`
        confirmDialogUrl += `&mc${msgNum}=${encodeURIComponent('red')}`
      } else {
////////message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionNotSpecial");
////////confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`

        if (isExtensionLocked) {
          message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionLocked");
          confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
        } else {
//////////message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionNotLocked");
//////////confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
        }
      }

      if (isExtensionGrantedAccess) {
        message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionGrantedAccess");
        confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
      } else {
        message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionNotGrantedAccess");
        confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
      }

      // I want this to be the last message for emphasis
      if (! isExtensionSpecial) {
        if (isExtensionDirProtect) {
          message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionDirProtect");
          confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
          confirmDialogUrl += `&mw${msgNum}=${encodeURIComponent('bold')}`
          confirmDialogUrl += `&mc${msgNum}=${encodeURIComponent('yellow')}`
        } else {
//////////message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionNotDirProtect");
//////////confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
        }
      }
    } else {
      message = utils.getI18nMsg("fsbStorageManager_dialog_confirmDeleteDirectory_extensionNotConfigured");
      confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(message)}`
    }

    confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(" ")}`;                // empty line

    confirmDialogUrl += `&m${++msgNum}=${encodeURIComponent(messageContinue)}`;
    confirmDialogUrl += `&ma${msgNum}=${encodeURIComponent('center')}`
    confirmDialogUrl += `&mw${msgNum}=${encodeURIComponent('bold')}`;

    confirmDialogUrl += `&c=${encodeURIComponent(msgNum)}`; // messageCount

    this.debug(`confirmDialogUrl="${confirmDialogUrl}"`);

    // DAMN!!! THERE'S NO WAY TO MAKE THIS MODAL!!! MUST USE action "default_popup".  But how to get Extension ID, etc?
    // The window.confirm() function doesn't give a way to specify button text.
    // Which is worse? Ugly ugly UGLY!!!
    const confirmDialogWindow = await messenger.windows.create(
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

    this.debug( "\n--- Delete Directories Confirmation Popup Window Created --",
                `\n- from ourTabId="${ourTabId}"`,
                `\n- from ourWindowId="${ourWindowId}"`,
                `\n- confirmDialogWindow.id="${confirmDialogWindow.id}"`,
                `\n- URL="${confirmDialogUrl}"`,
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

    const confirmDialogResponse = await this.#confirmDeleteDirectoryDialogPrompt(confirmDialogWindow.id, focusListener, null);
    this.debug(`-- confirmDialogResponse="${confirmDialogResponse}"`);

    switch (confirmDialogResponse) {
      case 'BUTTON_1': // 'Yes' button - Continue
        this.debug("-- ConfirmDialog 'Continue' clicked");
        return true;
      case 'BUTTON_2': // 'No' button - Cancel
        this.debug("-- ConfirmDialog 'Cancel' clicked");
        return false;
      case null:       // closed using the window close button
        this.debug("-- ConfirmDialog window closed");
        return false;
      default:
        this.error(`-- UNKNOWN ConfirmDialog Response - NOT A KNOWN RESPONSE: "${confirmDialogResponse}"`);
    }
  }

  async #confirmDeleteDirectoryDialogPrompt(confirmDialogWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(confirmDialogWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "-- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      async function windowRemovedListener(windowId) {
        if (windowId == confirmDialogWindowId) {

          messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
//////////if (focusListener) messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The ConfirmDialog sends a message as ConfirmDialogResponse:
       * - BUTTON_1 - the user clicked button 1          (sent by the ConfirmDialog window's button listener)
       * - BUTTON_2 - the user clicked button 2          (sent by the ConfirmDialog window's button listener)
       * - BUTTON_3 - the user clicked button 3          (sent by the ConfirmDialog window's button listener)
       * Save this ConfirmDialogResponse into var response for resolve()
       *
       * ALL BUTTONS ***MUST*** CAUSE THE WINDOW TO CLOSE ITSELF!!!  Otherwise windowRemovedListener() never gets called and thus resolve(response) never gets called
       */
      async function messageListener(request, sender) {
        if (sender.tab && sender.tab.windowId == confirmDialogWindowId && request && request.hasOwnProperty('ConfirmDialogResponse')) {
          response = request['ConfirmDialogResponse'] ;
        }

        return false; // we're not sending any response
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }




  async #getFsbStats(includeDirStats) {
    let fsbStatsResponse;
    try {
      if (includeDirStats !== undefined) {
        if ((typeof includeDirStats) !== 'boolean') {
          this.error(`includeDirStats parameter is not 'boolean': type='${(typeof includeDirStats)}'`);
        } else {
          fsbStatsResponse = await this.#fsBrokerApi.fsbStats( { 'includeDirStats': includeDirStats } );
        }
      } else {
        fsbStatsResponse = await this.#fsBrokerApi.fsbStats(); // defaults to: { 'includeDirStats': true }
      }
      this.debug( "\n\n========================\nfsbStatsResponse:\n", fsbStatsResponse, "\n========================\n\n" );
    } catch (error) {
      this.caught(error, "-- #getFsbStats");
    }

    if (! fsbStatsResponse) {
      this.error("-- fsbStats -- NO RESPONSE");
    } else if (fsbStatsResponse.invalid) {
      this.error(`-- fsbStats -- FSB STATS ERROR: ${fsbStatsResponse.invalid}`);
    } else if (fsbStatsResponse.error) {
      this.error(`-- fsbStats -- FSB STATS ERROR: ${fsbStatsResponse.error}`);
    } else if (! fsbStatsResponse.stats) {
      this.error("-- fsbStats -- NO STATS RETURNED");
    } else {
      return fsbStatsResponse.stats;
    }
  }



  #updateUIOnSelectionChanged() {
////const selectedCount = this.#getSelectedDomDirectoryListItemCount();
  }



  // and directory-list-item (TR or TD) was clicked
  async #directoryListItemClicked(e) {
    if (! e) return;

//////e.stopPropagation();
//////e.stopImmediatePropagation();

    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    if (e.target.tagName == "TR" || e.target.tagName == "TD" || e.target.tagName == "SPAN") {
      this.debug("-- TR or TD Clicked");

      let trElement = e.target;
      if (e.target.tagName == "TD" || e.target.tagName == "SPAN") {
        trElement = e.target.closest('tr.directory-list-item');
      }

      if (! trElement) {
        this.debug("-- Did NOT get our TR");

      } else {
        this.debug(  "-- Got our TR --"
                    + ` directory-list-item? ${trElement.classList.contains("directory-list-item")}`
                  );
        if (trElement.classList.contains("directory-list-item")) {
          const dirName     = trElement.getAttribute("dirName");
          const wasSelected = trElement.classList.contains('selected');

          this.debug(`-- wasSelected=${wasSelected}  dirName="${dirName}"`);

          if (! wasSelected) {
            trElement.classList.add('selected');
          } else {
            trElement.classList.remove('selected');
          }

          this.#updateUIOnSelectionChanged();
        }
      }
    }
  }



  #deSelectAllDirectories() {
    const domDirectoryList = document.getElementById("fsbStorageManagerDirectoryList");
    if (! domDirectoryList) {
      this.error("-- failed to get domDirectoryList");
    } else {
      var deSelected = 0;

      for (const listItemTR of domDirectoryList.children) {
        if (listItemTR.classList.contains("directory-list-item")) {
          if (listItemTR.classList.contains('selected')) {
            ++deSelected;
            listItemTR.classList.remove('selected');
          }
        }
      }

      if (deSelected) this.#updateUIOnSelectionChanged();
    }
  }



  // get only the FIRST!!!
  #getSelectedDomDirectoryListItem() {
    const domDirectoryList = document.getElementById("fsbStorageManagerDirectoryList");
    if (! domDirectoryList) {
      this.error("-- failed to get domDirectoryList");
    } else {
      for (const listItemTR of domDirectoryList.children) {
        if (listItemTR.classList.contains('directory-list-item') && listItemTR.classList.contains('selected')) {
          return listItemTR;
        }
      }
    }
  }

  #getSelectedDomDirectoryListItems() {
    const domDirectoryList = document.getElementById("fsbStorageManagerDirectoryList");
    if (! domDirectoryList) {
      this.error("-- failed to get domDirectoryList");
    } else {
      const selectedItems = [];

      for (const listItemTR of domDirectoryList.children) {
        if (listItemTR.classList.contains('directory-list-item') && listItemTR.classList.contains('selected')) {
          selectedItems.push(listItemTR);
        }
      }

      return selectedItems;
    }
  }

  #getSelectedDomDirectoryListItemCount() {
    var   count            = 0;
    const domDirectoryList = document.getElementById("fsbStorageManagerDirectoryList");

    if (! domDirectoryList) {
      this.error("-- failed to get domDirectoryList");
    } else {
      for (const listItemTR of domDirectoryList.children) {
        if (listItemTR.classList.contains('directory-list-item') && listItemTR.classList.contains('selected')) {
          ++count;
        }
      }
    }

    return count;
  }



  async #quotasTrialRunButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    this.#resetMessages();
    this.#resetErrors();

    e.preventDefault();

    const quotasTrialRunBtn = document.getElementById("fsbStorageManagerQuotasTrialRunButton");
    if (! quotasTrialRunBtn) {
      this.error("Failed to get element '#fsbStorageManagerQuotasTrialRunButton'");
    } else {
      quotasTrialRunBtn.disabled = true;
    }

    // MABXXX Is it more expensive (compute-wise) to do this every time?             Will it be done only rarely?
    // MABXXX Or is it more expensive (storage-wise) to do this in the constructor?  Will it be done a lot?
    const fsbCommandsApi = new FileSystemBrokerCommands(this.#logger, this.#fsbOptionsApi);
    const fsbEventLogger = new FsbEventLogger(this.#logger, this.#fsbOptionsApi, fsbCommandsApi);
    const qm             = new QuotaManager(this.#logger, this.#fsbOptionsApi, fsbCommandsApi, fsbEventLogger);
    const response       = await qm.processQuotas( { 'trialRun': true } );

    this.debugAlways("\n===== QuotaManager.processQuotas() Trial Run RESPONSE:\n", response);

    if (! response) {
      this.error("Failed to get response from QuotaManager.processQuotas()");
    } else if (response.error) {
      this.error(`Got 'error' response from QuotaManager.processQuotas(): ${response.error}`);
    } else if (response.invalid) {
      this.error(`Got 'invalid' response from QuotaManager.processQuotas(): ${response.invalid})`);
    } else if (response.status !== 'success') {
      this.error("Failed to get 'success' response from QuotaManager.processQuotas()");
    } else if (response.msg) {
      this.debug(`Got 'success' message from QuotaManager.processQuotas(): ${response.msg})`);
    } else if (! response.result) {
      this.error("Failed to get response 'result' from QuotaManager.processQuotas()");
    } else {
      const result = response.result;
      this.debugAlways(`\n\n----- QuotaManager.processQuotas() RESULT:\n`, result, "\n\n");

      // MABXXX Do something with the result

      //await this.#buildUI(); // Don't do this - Trial Run - Nothing Changed
    }

    if (quotasTrialRunBtn) quotasTrialRunBtn.disabled = false;
  }



  async #runQuotasCheckButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    this.#resetMessages();
    this.#resetErrors();

    e.preventDefault();
    const runQuotasCheckBtn = document.getElementById("fsbStorageManagerRunQuotasCheckButton");
    if (! runQuotasCheckBtn) {
      this.error("Failed to get element '#fsbStorageManagerRunQuotasCheckButton'");
    } else {
      runQuotasCheckBtn.disabled = true;
    }

    // MABXXX Is it more expensive (compute-wise) to do this every time?             Will it be done only rarely?
    // MABXXX Or is it more expensive (storage-wise) to do this in the constructor?  Will it be done a lot?
    const fsbCommandsApi = new FileSystemBrokerCommands(this.#logger, this.#fsbOptionsApi);
    const fsbEventLogger = new FsbEventLogger(this.#logger, this.#fsbOptionsApi, fsbCommandsApi);
    const qm             = new QuotaManager(this.#logger, this.#fsbOptionsApi, fsbCommandsApi, fsbEventLogger);
    const response       = await qm.processQuotas( { 'trialRun': false } );

    this.debug("\n===== QuotaManager.processQuotas() RESPONSE:\n", response);

    var error = false;
    if (! response) {
      this.error("Failed to get response from QuotaManager.processQuotas()");
      error = true;
    } else if (response.error) {
      this.error(`Got 'error' response from QuotaManager.processQuotas(): ${response.error}`);
      error = true;
    } else if (response.invalid) {
      this.error(`Got 'invalid' response from QuotaManager.processQuotas(): ${response.invalid})`);
      error = true;
    } else if (response.status !== 'success') {
      this.error("Failed to get 'success' response from QuotaManager.processQuotas()");
      error = true;
    } else if (response.msg) {
      this.debug(`Got 'success' message from QuotaManager.processQuotas(): ${response.msg})`);
      error = true;
    } else if (! response.result) {
      this.error("Failed to get response 'result' from QuotaManager.processQuotas()");
      error = true;
    }

    if (error) {
      //
    } else {
      const result = response.result;
      this.debug(`\n\n----- QuotaManager.processQuotas() RESULT:\n`, result, "\n\n");

      // MABXXX Do something with the result

      await this.#buildUI();
    }

    if (runQuotasCheckBtn) runQuotasCheckBtn.disabled = false;
  }



  async #resetAllExtQuotasButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    this.#resetMessages();
    this.#resetErrors();

    e.preventDefault();
    const resetAllExtensionsBtn = document.getElementById("fsbStorageManagerResetAllExtensionQuotasButton");
    if (! resetAllExtensionsBtn) {
      this.error("Failed to get element '#fsbStorageManagerResetAllExtensionQuotasButton'");
    } else {
      resetAllExtensionsBtn.disabled = true;
    }

    // MABXXX Is it more expensive (compute-wise) to do this every time?             Will it be done only rarely?
    // MABXXX Or is it more expensive (storage-wise) to do this in the constructor?  Will it be done a lot?
    const fsbCommandsApi = new FileSystemBrokerCommands(this.#logger, this.#fsbOptionsApi);
    const fsbEventLogger = new FsbEventLogger(this.#logger, this.#fsbOptionsApi, fsbCommandsApi);
    const qm             = new QuotaManager(this.#logger, this.#fsbOptionsApi, fsbCommandsApi, fsbEventLogger);
    const response       = await qm.resetAllExtQuotas();

    this.debug("\n===== QuotaManager.resetAllExtQuotas() RESPONSE:\n", response);

    var error = false;
    if (! response) {
      this.error("Failed to get response from QuotaManager.resetAllExtQuotas()");
      error = true;
    } else if (response.error) {
      this.error(`Got 'error' response from QuotaManager.resetAllExtQuotas(): ${response.error}`);
      error = true;
    } else if (response.invalid) {
      this.error(`Got 'invalid' response from QuotaManager.resetAllExtQuotas(: ${response.invalid})`);
      error = true;
    } else if (response.status !== 'success') {
      this.error("Failed to get 'success' response from QuotaManager.resetAllExtQuotas()");
      error = true;
    } else if (response.msg) {
      this.debug(`Got 'success' message from QuotaManager.resetAllExtQuotas(: ${response.msg})`);
      error = true;
    } else if (! response.result) {
      this.error("Failed to get response 'result' from QuotaManager.resetAllExtQuotas()");
      error = true;
    }

    if (error) {
      // message???
    } else {
      const result = response.result;
      this.debug(`\n\n----- QuotaManager.resetAllExtQuotas() RESULT:\n`, result, "\n\n");

      // MABXXX Do something with the result

      await this.#buildUI();
    }

    if (resetAllExtensionsBtn) resetAllExtensionsBtn.disabled = false;
  }



  async #resetExtQuotas(extId) {
    const dirItemSelector = `tr.directory-list-item[extId='${extId}']`;
    const dirItemTR       = document.querySelector(dirItemSelector);

    if (! dirItemTR) {
      this.error(`FAILED TO GET dirItemTR - selector="${dirItemSelector}"`);
      // MABXXX DISPLAY AN ERROR
//    this.#setErrorFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_XXX");

    } else {
      this.debug("\n--- SELECTED TR:\n\n", dirItemTR, "\n\n");

      const uiError = false;
      if (dirItemTR.classList.contains("file-system-root")) {
        this.error(`ERROR: dirItemTR with selector="${dirItemSelector}" HAS CLASS 'file-system-root'`);
        this.#setErrorFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_fileSystemRoot");
        uiError = true;
      } else if (! dirItemTR.classList.contains("configured")) {
        this.error(`ERROR: dirItemTR with selector="${dirItemSelector}" DOES NOT HAVE CLASS 'configured'`);
        this.#setErrorFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_notConfigured");
        uiError = true;
      } else if (dirItemTR.classList.contains("special")) {
        this.error(`ERROR: dirItemTR with selector="${dirItemSelector}" HAS CLASS 'special'`);
        this.#setErrorFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_special");
        uiError = true;
      } else if (dirItemTR.classList.contains("no-quota")) {
        this.error(`ERROR: dirItemTR with selector="${dirItemSelector}" HAS CLASS 'no-quota'`);
        this.#setErrorFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_noQuota");
        uiError = true;
      }

      if (! dirItemTR.classList.contains("over-quota")) {
        this.error(`WARNING: dirItemTR with selector="${dirItemSelector}" DOES NOT HAVE CLASS 'over-quota' (but reset anyway)`);
//      this.#setErrorFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_notOverQuota");
//      uiError = true; // MABXXX Technically an error but...
      }

      if (uiError) {
        // already set error message
      } else {
        // MABXXX Is it more expensive (compute-wise) to do this every time?             Will it be done only rarely?
        // MABXXX Or is it more expensive (storage-wise) to do this in the constructor?  Will it be done a lot?
        const fsbCommandsApi = new FileSystemBrokerCommands(this.#logger, this.#fsbOptionsApi);
        const fsbEventLogger = new FsbEventLogger(this.#logger, this.#fsbOptionsApi, fsbCommandsApi);
        const qm             = new QuotaManager(this.#logger, this.#fsbOptionsApi, fsbCommandsApi, fsbEventLogger);
        const response       = await qm.resetExtQuotas(extId);

        this.debug(`\n\n----- QuotaManager.resetExtQuotas("${extId}") RESPONSE:\n`, response, "\n\n");

        if (! response) {
          this.error(`Failed to get response from QuotaManager.resetExtQuotas("${extId}")`);
          this.#setErrorFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_failed");
        } else if (response.error) {
          this.error(`Got 'error' response from QuotaManager.resetExtQuotas("${extId}"): ${response.error}`);
          this.#setErrorFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_failed");
        } else if (response.invalid) {
          this.error(`Got 'invalid' response from QuotaManager.resetExtQuotas("${extId})": ${response.invalid})`);
          this.#setErrorFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_failed");
        } else if (response.status !== 'success') {
          this.error(`Failed to get 'success' response from QuotaManager.resetExtQuotas("${extId}")`);
          this.#setErrorFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_failed");
        } else if (response.msg) {
          this.debug(`Got 'success' message from QuotaManager.resetExtQuotas("${extId})": ${response.msg})`);
          this.#setErrorFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_failed");
        } else if (! response.result) {
          this.error(`Failed to get response 'result' from QuotaManager.resetExtQuotas("${extId}")`);
          this.#setErrorFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_failed");
        } else {
          const result = response.result;
          this.debug(`\n\n----- QuotaManager.resetExtQuotas("${extId}") RESULT:\n`, result, "\n\n");

          // MABXXX Do something with the result

          const extResetQuotasButton = dirItemTR.querySelector( "button.button-reset-ext-quotas" );
          const extCountChildrenTD   = dirItemTR.querySelector( "td.count-items"                 ); // directory-list-item > count-items
          const extSizeLargestTD     = dirItemTR.querySelector( "td.size-largest"                ); // directory-list-item > size-largest
          const extSizeTotalTD       = dirItemTR.querySelector( "td.size-total"                  ); // directory-list-item > size-total

          if (dirItemTR.classList.contains("over-quota")) {
            dirItemTR.classList.remove("over-quota");
          }

          if (extResetQuotasButton) {
            extResetQuotasButton.disabled = true;
            extResetQuotasButton.classList.add( "disabled-not-over-quota" );
            extResetQuotasButton.setAttribute("title", this.#listItemTooltip_extQuotaButton_notOverQuotas);
          }

          if (extCountChildrenTD) {
            extCountChildrenTD.classList.remove( "list-item-over-quota" );
            extCountChildrenTD.classList.remove( "marked-data"          );
          }

          if (extSizeLargestTD) {
            extSizeLargestTD.classList.remove( "list-item-over-quota" );
            extSizeLargestTD.classList.remove( "marked-data"          );
          }

          if (extSizeTotalTD) {
            extSizeTotalTD.classList.remove( "list-item-over-quota" );
            extSizeTotalTD.classList.remove( "marked-data"          );
          }

          await this.#updateFsbStatsUI();

          this.#setMessageFor("fsbStorageManagerActionsPanel", "fsbStorageManager_error_resetExtQuotas_success");
        }
      }
    }
  }



  async #refreshButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    this.#resetMessages();
    this.#resetErrors();

    e.preventDefault();

    // the call to #buildUI() below will call #resetMMessages() and #resetErrors() and #updateUIOnSelectionChanged()

    const refreshBtn = document.getElementById("fsbStorageManagerRefreshButton");
    if (! refreshBtn) {
      this.error("Failed to get element '#fsbStorageManagerRefreshButton'");
    } else {
      refreshBtn.disabled = true;
    }

    // calls #resetMessages() and #resetErrors() and #updateUIOnSelectionChanged()
    await this.#buildUI();

    if (refreshBtn) refreshBtn.disabled = false;
  }



  #resetMessages() {
    this.debug("---");

    let messagesPanelDivs = document.querySelectorAll("div.messages-panel"); // <--------------- NOTE: messages-panel - same as for #resetErrors(), but different attribute
    if (messagesPanelDivs) {
      this.debug(`messagesPanelDivs.length = ${messagesPanelDivs.length }`);
      for (const messagesPanelDiv of messagesPanelDivs) {
        messagesPanelDiv.setAttribute("msg", "false"); // <------------------------------------- different from #resetErrors(); not really used by CSS anymore
      }
    }

    let msgDivs = document.querySelectorAll("div.msg");
    if (msgDivs) {
      this.debug(`msgDivs.length = ${msgDivs.length}`);
      for (const msgDiv of msgDivs) {
        this.debug("Removing msgDiv:", msgDiv);
        msgDiv.remove();
      }
    }
  }

  #setMessageFor(elementId, msgId, parms) {
    var i18nMessage;
    if (parms !== null && parms !== undefined) {
      i18nMessage = utils.getI18nMsgSubst(msgId, parms);
    } else {
      i18nMessage = utils.getI18nMsg(msgId);
    }

    if (i18nMessage) {
      if (elementId && msgId) {
        const messagesPanelDivSelector = `div.messages-panel[messages-for='${elementId}']`;
        const messagesPanelDiv         = document.querySelector(messagesPanelDivSelector);
        if (! messagesPanelDiv) {
          //
        } else {
          messagesPanelDiv.setAttribute("msg", "true");  // this doesn't really do anything in the CSS anymore.  CSS uses .messages-panel:has([msg="true"])

          const msgDiv = document.createElement('div');
            msgDiv.classList.add('msg');
            msgDiv.setAttribute( "msg-for", elementId );
            msgDiv.setAttribute( "msg",     "true"    ); // <----- this causes the parent <div> to get displayed

            const msgIconSpan = document.createElement('label');
              msgIconSpan.classList.add('msg-icon-large');
              msgIconSpan.setAttribute( "msg-for", elementId );
            msgDiv.appendChild(msgIconSpan);

            const msgLabel = document.createElement('label');
              msgLabel.classList.add('msg-text');
              msgLabel.setAttribute( "msg-for", elementId );
              msgLabel.setAttribute( "msg",     "true"    );
              msgLabel.innerText = i18nMessage;
            msgDiv.appendChild(msgLabel);

          messagesPanelDiv.appendChild(msgDiv);
        }
      }
    }
  }



  #resetErrors() {
    let messagesPanelDivs = document.querySelectorAll("div.messages-panel"); // <--------------- NOTE: messages-panel - same as for #resetMessages(), but different attribute
    if (messagesPanelDivs) {
      for (const messagesPanelDiv of messagesPanelDivs) {
        messagesPanelDiv.setAttribute("error", "false"); // <----------------------------------- different from #resetMessages(); not really used by CSS anymore
      }
    }

    let errorDivs = document.querySelectorAll("div.error");
    if (errorDivs) {
      for (const errorDiv of errorDivs) {
        errorDiv.remove();
      }
    }
  }

  #setErrorFor(elementId, msgId, parms) {
    var i18nMessage;
    if (parms) {
      i18nMessage = utils.getI18nMsgSubst(msgId, parms);
    } else {
      i18nMessage = utils.getI18nMsg(msgId);
    }

    if (i18nMessage) {
      if (elementId && msgId) {
        const divPanelSelector = `div.messages-panel[messages-for='${elementId}']`;
        const messagesPanelDiv = document.querySelector(divPanelSelector);

        if (! messagesPanelDiv) {
          //
        } else {
          messagesPanelDiv.setAttribute("error", "true");    // this doesn't really do anything in the CSS anymore.  CSS uses .messages-panel:has([error="true"])

          const errorDiv = document.createElement('div');
            errorDiv.classList.add('error');
            errorDiv.setAttribute( "error-for", elementId );
            errorDiv.setAttribute( "error",     "true"    ); // <----- this causes the parent <div> to get displayed

            const errorIconSpan = document.createElement('label');
              errorIconSpan.classList.add('error-icon-large');
              errorIconSpan.setAttribute( "error-for", elementId );
            errorDiv.appendChild(errorIconSpan);

            const errorLabel = document.createElement('label');
              errorLabel.classList.add('error-text');
              errorLabel.setAttribute( "error-for", elementId );
              errorLabel.setAttribute( "error",     "true"    );
              errorLabel.innerText = i18nMessage;
            errorDiv.appendChild(errorLabel);

          messagesPanelDiv.appendChild(errorDiv);
        }
      }
    }
  }



  async #doneButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    this.#resetMessages();
    this.#resetErrors();

    e.preventDefault();

    this.#canceled = true;

    let responseMessage = "DONE";
    this.debug(`-- Sending responseMessage="${responseMessage}"`);

    try {
      await messenger.runtime.sendMessage(
        { StorageManagerResponse: responseMessage }
      );
    } catch (error) {
      // any need to tell the user???
      this.caught( error,
                   "##### SEND RESPONSE MESSAGE FAILED #####"
                   + `\n- responseMessage="${responseMessage}"`
                 );
    }

    this.debug("-- Closing window");
    window.close();
  }
}



const storageManager = new StorageManager();

document.addEventListener("DOMContentLoaded", (e) => storageManager.run(e), {once: true});
