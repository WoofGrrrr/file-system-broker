import { Logger              } from '../modules/logger.js';
import { FsbOptions          } from '../modules/options.js';
import { FileSystemBrokerAPI } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { getI18nMsg, getI18nMsgSubst, formatMsToDateTime24HR, formatMsToDateTime12HR } from '../modules/utilities.js';


/* TBD:
 * - Delete Directory doesn't update fsbStats!!!
 *
 */


class StatsManager {
  #CLASS_NAME    = this.constructor.name;

  #INFO          = false;
  #LOG           = false;
  #DEBUG         = false;
  #WARN          = false;

  #IGNORE_DIRECTORIES     = false;
  #IGNORE_DIRECTORY_NAMES = [ ".tmp.drivedownload", ".tmp.driveupload", "$Temp" ]; // these (hidden) directories are created by Google Drive & ProtonDrive

  #logger        = new Logger();
  #fsbOptionsApi = new FsbOptions(this.logger);
  #fsBrokerApi   = new FileSystemBrokerAPI();

  //// don't need to do any of this this because we aren't using options that need FsbEventLogger
//fsbCommandsApi = new FileSystemBrokerCommands(this.logger, this.fsbOptionsApi);
//fsbEventLogger = new FsbEventLogger(this.logger, this.fsbOptionsApi, this.fsbCommandsApi); // <---- this is why we new fsbCommandsApi 
//#fsbOptionsApi.setEventLogger(this.#fsbEventLogger);
//fsbCommandsApi.setEventLogger(this.fsbEventLogger);
  

  // internal state
  #canceled = false;


  #listHeaderText_dirName                    = getI18nMsg( "fsbStatsManager_directoryListHeader_directoryName",              "Directory Name"     );
  #listHeaderText_dirPathName                = getI18nMsg( "fsbStatsManager_directoryListHeader_directoryName",              "Directory PathName" );
  #listHeaderText_extensionId                = getI18nMsg( "fsbStatsManager_directoryListHeader_extensionId",                "Extension ID"       );
  #listHeaderText_extensionInstalled         = getI18nMsg( "fsbStatsManager_directoryListHeader_extensionInstalled",         "I?"                 );
  #listHeaderText_extensionEnabled           = getI18nMsg( "fsbStatsManager_directoryListHeader_extensionEnabled",           "E?"                 );
  #listHeaderText_extensionConfigured        = getI18nMsg( "fsbStatsManager_directoryListHeader_extensionConfigured",        "C?"                 );
  #listHeaderText_extensionAccessAllowed     = getI18nMsg( "fsbStatsManager_directoryListHeader_extensionAccessAllowed",     "A?"                 );

  #listHeaderText_count_children             = getI18nMsg( "fsbStatsManager_directoryListHeader_count_children",             "#I"                 );
  #listHeaderText_count_regular              = getI18nMsg( "fsbStatsManager_directoryListHeader_count_type_regular",         "#R"                 );
  #listHeaderText_count_directory            = getI18nMsg( "fsbStatsManager_directoryListHeader_count_type_directory",       "#D"                 );
  #listHeaderText_count_other                = getI18nMsg( "fsbStatsManager_directoryListHeader_count_type_other",           "#O"                 );
  #listHeaderText_count_unknown              = getI18nMsg( "fsbStatsManager_directoryListHeader_count_type_unknown",         "#U"                 );
  #listHeaderText_count_error                = getI18nMsg( "fsbStatsManager_directoryListHeader_count_type_error",           "#E"                 );

  #listHeaderText_time_creation_earliest     = getI18nMsg( "fsbStatsManager_directoryListHeader_time_creation_earliest",     ""                   );
  #listHeaderText_time_creation_latest       = getI18nMsg( "fsbStatsManager_directoryListHeader_time_creation_latest",       ""                   );
  #listHeaderText_time_lastAccessed_earliest = getI18nMsg( "fsbStatsManager_directoryListHeader_time_lastAccessed_earliest", ""                   );
  #listHeaderText_time_lastAccessed_latest   = getI18nMsg( "fsbStatsManager_directoryListHeader_time_lastAccessed_latest",   ""                   );
  #listHeaderText_time_lastModified_earliest = getI18nMsg( "fsbStatsManager_directoryListHeader_time_lastModified_earliest", ""                   );
  #listHeaderText_time_lastModified_latest   = getI18nMsg( "fsbStatsManager_directoryListHeader_time_lastModified_latest",   ""                   );

  #listHeaderText_size_smallest              = getI18nMsg( "fsbStatsManager_directoryListHeader_size_smallest",              ""                   );
  #listHeaderText_size_largest               = getI18nMsg( "fsbStatsManager_directoryListHeader_size_largest",               ""                   );
  #listHeaderText_size_total                 = getI18nMsg( "fsbStatsManager_directoryListHeader_size_total",                 ""                   );


  #listHeaderTooltip_dirName                    = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_directoryName",              "Directory Name"                );
  #listHeaderTooltip_dirPathName                = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_directoryName",              "Directory PathName"            );
  #listHeaderTooltip_extensionId                = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_extensionId",                "Extension ID"                  );
  #listHeaderTooltip_extensionInstalled         = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_extensionInstalled",         "Installed?"                    );
  #listHeaderTooltip_extensionEnabled           = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_extensionEnabled",           "Enabled?"                      );
  #listHeaderTooltip_extensionConfigured        = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_extensionConfigured",        "Configured?"                   );
  #listHeaderTooltip_extensionAccessAllowed     = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_extensionAccessAllowed",     "Access Allowed?"               );

  #listHeaderTooltip_count_children             = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_count_children",             "Number of Items"               );
  #listHeaderTooltip_count_regular              = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_count_type_regular",         "Number of Regular Files"       );
  #listHeaderTooltip_count_directory            = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_count_type_directory",       "Number of Directories"         );
  #listHeaderTooltip_count_other                = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_count_type_other",           "Number of Other Items"         );
  #listHeaderTooltip_count_unknown              = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_count_type_unknown",         "Number of Unknown"             );
  #listHeaderTooltip_count_error                = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_count_type_error",           "Number of Errors getting Type" );

  #listHeaderTooltip_time_creation_earliest     = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_time_creation_earliest",     "Earliest Creation Time"        );
  #listHeaderTooltip_time_creation_latest       = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_time_creation_latest",       "Latest Creation Time"          );
  #listHeaderTooltip_time_lastAccessed_earliest = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_time_lastAccessed_earliest", "Earliest Last Accessed Time"   );
  #listHeaderTooltip_time_lastAccessed_latest   = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_time_lastAccessed_latest",   "Latest Last Accessed Time"     );
  #listHeaderTooltip_time_lastModified_earliest = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_time_lastModified_earliest", "Earliest Last MOdified Time"   );
  #listHeaderTooltip_time_lastModified_latest   = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_time_lastModified_latest",   "Latest Last MOdified Time"     );

  #listHeaderTooltip_size_smallest              = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_size_smallest",              "Smallest Regular File"         );
  #listHeaderTooltip_size_largest               = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_size_largest",               "Largest Regular File"          );
  #listHeaderTooltip_size_total                 = getI18nMsg( "fsbStatsManager_directoryListHeader_tooltip_size_total",                 "Total of Regular File sizes"   );



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

    const showInstructions = await this.#fsbOptionsApi.isEnabledShowStatsManagerInstructions();
    this.#showHideInstructions(showInstructions);

    await this.#updateOptionsUI();
    await this.#localizePage();
    await this.#buildUI();
    this.#setupEventListeners();
  }



  #setupEventListeners() {
    document.addEventListener( "change", (e) => this.#optionChanged(e) );   // One of the checkboxes or radio buttons was clicked or a select has changed

    const doneBtn = document.getElementById("fsbStatsManagerDoneButton");
    if (! doneBtn) {
      this.error("Failed to get element '#fsbStatsManagerDoneButton'");
    } else {
      doneBtn.addEventListener("click", (e) => this.#doneButtonClicked(e));
    }

    const refreshBtn = document.getElementById("fsbStatsManagerRefreshButton");
    if (! refreshBtn) {
      this.error("Failed to get element '#fsbStatsManagerRefreshButton'");
    } else {
      refreshBtn.addEventListener("click", (e) => this.#refreshButtonClicked(e));
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



  async #updateOptionsUI() {
    this.debug("-- start");

    const options = await this.#fsbOptionsApi.getAllOptions();

    this.debug("-- sync options to UI");
    for (const [optionName, optionValue] of Object.entries(options)) {
      this.debug("-- option: ", optionName, "value: ", optionValue);

      if (this.#fsbOptionsApi.isDefaultOption(optionName)) { // MABXXX WHY WHY WHY???
        const optionElement = document.getElementById(optionName);

        if (optionElement && optionElement.classList.contains("fsbGeneralOption")) {
          if (optionElement.tagName === 'INPUT') {
            if (optionElement.type === 'checkbox') {
              optionElement.checked = optionValue;
            } else if (optionElement.type === 'radio') {
              optionElement.value = optionValue;
            } else if (optionElement.type === 'text') {
              // MABXXX we don't handle this yet...
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



  // One of the Options checkboxes or radio buttons (etc) has been clicked or a select has changed
  //
  // copied from optionsUI.js, so this does a lot that we don't really need for now.
  async #optionChanged(e) {
    if (e == null) return;
    this.debug(`-- tagName="${e.target.tagName}" type="${e.target.type}" fsbGeneralOption? ${e.target.classList.contains("fsbGeneralOption")} id="${e.target.id}"`);

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
        this.debug(`-- radio buttton selected ${optionName}=<${optionValue}> - group=${target.name}`);

        // first, set this option
        this.debug(`-- Setting Radio Option {[${optionName}]: ${optionValue}}`);
        await this.#fsbOptionsApi.storeOption(
          { [optionName]: optionValue }
        );

        // get all the elements with the same name, and if they're a radio, un-check them
        if (target.name) { /* && (optionValue == true || optionValue == 'true')) { Don't need this. Event fired *ONLY* when SELECTED, i.e. true */
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
      } else { // since we already tested for it, it's got to be a checkbox
        this.debug(`-- Setting Checkbox Option {[${optionName}]: ${optionValue}}`);
        await this.#fsbOptionsApi.storeOption(
          { [optionName]: optionValue }
        );

        // special processing for these checkboxes
        switch (optionName) {
          case "fsbShowStatsManagerInstructions": 
            this.#showHideInstructions(optionValue);
            break;
        }
      }
    } else if ( target.tagName === 'SELECT'
                && target.classList.contains("fsbGeneralOption")
              )
    {
      const optionName  = target.id;
      const optionValue = target.value;

      this.debug(`-- Setting Select Option {[${optionName}]: ${optionValue}}`);
      await this.#fsbOptionsApi.storeOption(
        { [optionName]: optionValue }
      );
    }
  }



  #showHideInstructions(show) {
    this.debug(`-- show=${show}`);
    const panel = document.getElementById("fsbStatsManagerInstructions");
    if (panel) {
      if (show) {
        panel.style.setProperty('display', 'block');
      } else {
        panel.style.setProperty('display', 'none');
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
    await this.#fsbOptionsApi.storeWindowBounds("statsManagerWindowBounds", window);

    if (this.DEBUG) {
      let bounds = await this.#fsbOptionsApi.getWindowBounds("statsManagerWindowBounds");

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

    const domDirectoryList = document.getElementById("fsbStatsManagerDirectoryList");
    if (! domDirectoryList) {
      this.error("-- failed to get element #fsbStatsManagerDirectoryList");
      this.#setErrorFor("fsbStatsManagerTitlePanel", fsbStatsManager_error_noDirectoryListElement);
      return;
    }
    domDirectoryList.innerHTML = '';
    this.#updateUIOnSelectionChanged();

    const i18nMessage = getI18nMsg("fsbStatsManager_message_directoryListLoading", "...");
    const loadingTR = document.createElement("tr");
    loadingTR.classList.add("data-loading-message");
    loadingTR.appendChild( document.createTextNode(i18nMessage) ); // you can put a text node in a TR ???
    domDirectoryList.appendChild(loadingTR);

    const stats = await this.#getFsbStats();
    this.debug("---stats\n", stats);
    const fsbStats    = stats?.fsbStats
    const fsbDirStats = stats?.dirStats

    if (! stats) {
      this.error("---NO stats");
      this.#setErrorFor("fsbStatsManagerTitlePanel", "fsbStatsManager_error_noDirectories"); /// MABXXX NEED A DIFFERENT ERROR MESSAGE

    } else {
      await this.#updateFsbStatsUI(fsbStats);

      await this.#buildDirectoryListUI(domDirectoryList, fsbDirStats);
    }
  }

  async #updateFsbStatsUI(fsbStats) {
    this.debug("\n===================fsbStats:\n", fsbStats);

    if (! fsbStats) {
      this.error("---NO fsbStats");
      this.#setErrorFor("fsbStatsManagerTitlePanel", "fsbStatsManager_error_noDirectories"); /// MABXXX NEED A DIFFERENT ERROR MESSAGE
      return;
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
      if (Number.isInteger(fsbStats.time_childCreation_earliest)) {
        element.textContent = formatMsToDateTime24HR( fsbStats.time_childCreation_earliest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_time_creation_latest");
    if (element) {
      if (Number.isInteger(fsbStats.time_childCreation_latest)) {
        element.textContent = formatMsToDateTime24HR( fsbStats.time_childCreation_latest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_time_last_accessed_earliest");
    if (element) {
      if (Number.isInteger(fsbStats.time_childLastAccessed_earliest)) {
        element.textContent = formatMsToDateTime24HR( fsbStats.time_childLastAccessed_earliest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_time_last_accessed_latest");
    if (element) {
      if (Number.isInteger(fsbStats.time_childLastAccessed_latest)) {
        element.textContent = formatMsToDateTime24HR( fsbStats.time_childLastAccessed_latest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_time_last_modified_earliest");
    if (element) {
      if (Number.isInteger(fsbStats.time_childLastModified_earliest)) {
        element.textContent = formatMsToDateTime24HR( fsbStats.time_childLastModified_earliest );
      } else {
        element.textContent = "";
      }
    }

    element = document.getElementById("stats_data_time_last_modified_latest");
    if (element) {
      if (Number.isInteger(fsbStats.time_childLastModified_latest)) {
        element.textContent = formatMsToDateTime24HR( fsbStats.time_childLastModified_latest );
      } else {
        element.textContent = "";
      }
    }
  }

  async #buildDirectoryListUI(domDirectoryList, fsbDirStats) {
    this.debug("\n===================fsbDirStats:\n", fsbDirStats);

    domDirectoryList.innerHTML = '';

    if (! fsbDirStats) {
      this.error("---NO fsbDirStats");
      this.#setErrorFor("fsbStatsManagerTitlePanel", "fsbStatsManager_error_noDirectories");
      return;

    } else if (Object.keys(fsbDirStats).length < 1) {
      this.error("---fsbDirStats.length < 1");
      this.#setErrorFor("fsbStatsManagerTitlePanel", "fsbStatsManager_error_noDirectories");
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
      this.#setErrorFor("fsbStatsManagerTitlePanel", "fsbStatsManager_error_noDirectories");
      return;

    } else {
      const installedExtensions = await messenger.management.getAll();
      const allExtensionsProps  = await this.#fsbOptionsApi.getExtensionsProps();;
      const sortedKeys          = Object.keys(fsbDirStats).sort( (a, b) => { return a.localeCompare( b, undefined, {'sensitivity': 'base'} ) } );

      for (const key of sortedKeys) {
        const dirStats = fsbDirStats[key];
        var   extensionInfo
        var   extensionProps

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

        if (! allExtensionsProps) {
          this.debug("---NO allExtensionsProps");
        } else {
          extensionProps = (allExtensionsProps && dirStats.dirName in allExtensionsProps) ? allExtensionsProps[dirStats.dirName] : null;
        }

        if (! extensionProps) {
          this.debug("---NO extensionProps");
        } else {
          this.debug("\n---extensionProps:\n", extensionProps);
        }

        const listItemUI = await this.#buildDirectoryListItemUI(dirStats, extensionInfo, extensionProps);
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
//////////const deleteDirectoryButton = document.createElement("button");
////////////deleteDirectoryButton.classList.add("delete-directory-button");
////////////const deleteDirectoryButtonLabel = document.createElement("label");
//////////////
////////////deleteDirectoryButton.appendChild(deleteDirectoryButtonLabel);
//////////controlsDiv.appendChild(deleteDirectoryButton);
        controlsTH.appendChild(controlsDiv);
      dirHeaderTR.appendChild(controlsTH);

      // Create Directory Name element and add it to the row
      const dirNameTH = document.createElement("th");
        dirNameTH.classList.add("list-header-data");  // directory-list-header > list-header-data
        dirNameTH.classList.add("header-name");       // directory-list-header > header-name
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
        extConfiguredTH.classList.add("list-header-data");        // directory-list-header > list-header-data
        extConfiguredTH.classList.add("header-ext-configured");  // directory-list-header > header-ext-configured
        extConfiguredTH.appendChild( document.createTextNode(this.#listHeaderText_extensionConfigured) );
        extConfiguredTH.setAttribute("title", this.#listHeaderTooltip_extensionConfigured);
      dirHeaderTR.appendChild(extConfiguredTH);

      // Create Extension Access Allowed element and add it to the row
      const extAccessAllowedTH = document.createElement("th");
        extAccessAllowedTH.classList.add("list-header-data");        // directory-list-header > list-header-data
        extAccessAllowedTH.classList.add("header-ext-access");  // directory-list-header > header-ext-access
        extAccessAllowedTH.appendChild( document.createTextNode(this.#listHeaderText_extensionAccessAllowed) );
        extAccessAllowedTH.setAttribute("title", this.#listHeaderTooltip_extensionAccessAllowed);
      dirHeaderTR.appendChild(extAccessAllowedTH);

      // Create Item Count element and add it to the row
      const itemCountTH = document.createElement("th");
        itemCountTH.classList.add("list-header-data");       // directory-list-header > list-header-data
        itemCountTH.classList.add("header-count-children");  // directory-list-header > header-count-children
        itemCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_children) );
        itemCountTH.setAttribute("title", this.#listHeaderTooltip_count_children);
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
  async #buildDirectoryListItemUI(dirStats, extensionInfo, extensionProps) {
    /* if extensionInfo (management.ExtensionInfo) is not null, it means an extension is installed whose ID matches dirStats.dirName 
     *
     * If extnesionProps is not null, it means and extension is configured (see class FsbOptions) whose ID matches dirStats.dirName 
     *
     * dirStats:
     *   {
     *     'dirName':                         string:   directory fileName
     *     'dirPath':                         string:   directory full pathName
     *     'error':                           string:   a description if there was an error getting information. None of the data below will be present.
     *     'count_children':                  integer:  total number of child items
     *     'count_type_regular':              integer:  number of child items with type 'regular'
     *     'count_type_directory':            integer:  number of child items with type 'directory'
     *     'count_type_other':                integer:  number of child items with type 'other'
     *     'count_type_unknown':              integer:  number of child items whose type is none of the three above
     *     'count_type_error':                integer:  number of child items whose type could not be determined
     *     'time_childCreation_earliest':     integer:  earliest Creation Time      of all child items in MS (OS-dependent) (undefined if no children)
     *     'time_childCreation_latest':       integer:  latest   Creation Time      of all child items in MS (OS-dependent) (undefined if no children)
     *     'time_childLastAccessed_earliest': integer:  earliest Last Accessed Time of all child items in MS (OS-dependent) (undefined if no children)
     *     'time_childLastAccessed_latest':   integer:  latest   Last Accessed Time of all child items in MS (OS-dependent) (undefined if no children)
     *     'time_childLastModified_earliest': integer:  earliest Last Modified Time of all child items in MS (OS-dependent) (undefined if no children)
     *     'time_childLastModified_latest':   integer:  latest   Last Modified Time of all child items in MS (OS-dependent) (undefined if no children)
     *     'size_smallest':                   integer:  smallest size (bytes) of all child items with type 'regular' (-1 if none)
     *     'size_largest':                    integer:  largest size (bytes) of all child items with type 'regular' (-1 if none)
     *     'size_total':                      integer:  total of sizes (bytes) of all child items with type 'regular'
     *   }
     */
    this.debug(`BUILD DIRECTORY LIST ITEM UI: --- \n--dirStats:\n`, dirStats, "\n--extensionInfo:\n", extensionInfo, "\n--extensionProps:\n", extensionProps);

    const dirItemTR = document.createElement("tr");
      dirItemTR.classList.add("directory-list-item");                          // directory-list-item

      dirItemTR.setAttribute( "dirname",    dirStats.dirName                                               );
      dirItemTR.setAttribute( "dirpath",    dirStats.dirPath                                               );
      dirItemTR.setAttribute( "itemcount",  dirStats.count_children                                        );
      dirItemTR.setAttribute( "installed",  ( extensionInfo  !== undefined && extensionInfo  !== null    ) );
      dirItemTR.setAttribute( "enabled",    ( extensionInfo                && ! extensionInfo.disabled   ) );
      dirItemTR.setAttribute( "configured", ( extensionProps !== undefined && extensionProps !== null    ) );
      dirItemTR.setAttribute( "access",     ( extensionProps               && extensionProps.allowAccess ) );

      dirItemTR.addEventListener("click", (e) => this.#directoryListItemClicked(e));

      // Create Controls element and add it to the row
      const controlsTD = document.createElement("td");
        controlsTD.classList.add("list-item-controls");                        // directory-list-item > list-item-controls
        const controlsDiv = document.createElement("div");
          controlsDiv.classList.add("item-controls-panel");                    // directory-list-item > list-item-controls > item-controls-panel

          const deleteDirectoryButton = document.createElement("button");
            deleteDirectoryButton.classList.add("item-controls-button");       // directory-list-item > list-item-controls > item-controls-panel > item-controls-button
            deleteDirectoryButton.classList.add("extension-icon-button");      // directory-list-item > list-item-controls > item-controls-panel > extension-icon-button
            deleteDirectoryButton.classList.add("icon-button");                // directory-list-item > list-item-controls > item-controls-panel > icon-button
            deleteDirectoryButton.classList.add("icon-only");                  // directory-list-item > list-item-controls > item-controls-panel > icon-only
            deleteDirectoryButton.classList.add("button-delete-directory");    // directory-list-item > list-item-controls > item-controls-panel > button-delete-directory
            deleteDirectoryButton.setAttribute("dirname", dirStats.dirName);
            deleteDirectoryButton.setAttribute("dirpath", dirStats.dirPath);
            deleteDirectoryButton.addEventListener("click", (e) => this.#directoryListItemControlClicked(e));
          controlsDiv.appendChild(deleteDirectoryButton);

        controlsTD.appendChild(controlsDiv);
      dirItemTR.appendChild(controlsTD);

      // Create Directory Name element and add it to the row
      const dirNameTD = document.createElement("td");
        dirNameTD.classList.add("list-item-data"); // directory-list-item > list-item-data
        dirNameTD.classList.add("list-item-name"); // directory-list-item > list-item-name
        if (dirStats.dirName) {
          dirNameTD.appendChild( document.createTextNode(dirStats.dirName) );
        }
      dirItemTR.appendChild(dirNameTD);

      // Create Extension ID element and add it to the row
      const extIdTD = document.createElement("td");
        extIdTD.classList.add("list-item-data");   // directory-list-item > list-item-data
        extIdTD.classList.add("list-item-ext-id"); // directory-list-item > list-item-ext-id
        if (extensionInfo && extensionInfo.id) {
          extIdTD.appendChild( document.createTextNode(extensionInfo.id) );
        }
      dirItemTR.appendChild(extIdTD);

      // Create Extension Installed element and add it to the row
      const extInstalledTD = document.createElement("td");
        extInstalledTD.classList.add("list-item-data");          // directory-list-item > list-item-data
        extInstalledTD.classList.add("list-item-boolean");       // directory-list-item > list-item-boolean
        extInstalledTD.classList.add("list-item-ext-installed"); // directory-list-item > list-item-ext-installed
        const extInstalledDotSpan = document.createElement("span");
          extInstalledDotSpan.classList.add("list-item-dot");
          if (extensionInfo) {
            extInstalledDotSpan.classList.add("dot-ext-installed");
          } else {
            extInstalledDotSpan.classList.add("dot-ext-not-installed");
          }
        extInstalledTD.appendChild(extInstalledDotSpan);
      dirItemTR.appendChild(extInstalledTD);

      // Create Extension Enabled element and add it to the row
      const extEnabledTD = document.createElement("td");
        extEnabledTD.classList.add("list-item-data");        // directory-list-item > list-item-data
        extEnabledTD.classList.add("list-item-boolean");     // directory-list-item > list-item-boolean
        extEnabledTD.classList.add("list-item-ext-enabled"); // directory-list-item > list-item-ext-enabled
        const extEnabledDotSpan = document.createElement("span");
          extEnabledDotSpan.classList.add("list-item-dot");
          if (extensionInfo) {
            if (extensionInfo.disabled) {
              extEnabledDotSpan.classList.add("dot-ext-disabled");
            } else {
              extEnabledDotSpan.classList.add("dot-ext-enabled");
            }
          } else {
            extEnabledDotSpan.classList.add("dot-ext-disabled-not-installed");
          }
        extEnabledTD.appendChild(extEnabledDotSpan);
      dirItemTR.appendChild(extEnabledTD);

      // Create Extension Configured element and add it to the row
      const extConfiguredTD = document.createElement("td");
        extConfiguredTD.classList.add("list-item-data");           // directory-list-item > list-item-data
        extConfiguredTD.classList.add("list-item-boolean");        // directory-list-item > list-item-boolean
        extConfiguredTD.classList.add("list-item-ext-configured"); // directory-list-item > list-item-ext-configured
        const extConfiguredDotSpan = document.createElement("span");
          extConfiguredDotSpan.classList.add("list-item-dot");
          if (extensionProps) {
            extConfiguredDotSpan.classList.add("dot-ext-configured");
          } else {
            extConfiguredDotSpan.classList.add("dot-ext-not-configured");
          }
        extConfiguredTD.appendChild(extConfiguredDotSpan);
      dirItemTR.appendChild(extConfiguredTD);

      // Create Extension Access Allowed element and add it to the row
      const extAccessAllowedTD = document.createElement("td");
        extAccessAllowedTD.classList.add("list-item-data");       // directory-list-item > list-item-data
        extAccessAllowedTD.classList.add("list-item-boolean");    // directory-list-item > list-item-boolean
        extAccessAllowedTD.classList.add("list-item-ext-access"); // directory-list-item > list-item-ext-access-allowed
        const extAccessAllowedDotSpan = document.createElement("span");
          extAccessAllowedDotSpan.classList.add("list-item-dot");
          if (extensionProps) {
            if (extensionProps.allowAccess) {
              extAccessAllowedDotSpan.classList.add("dot-ext-access-allowed");
            } else {
              extAccessAllowedDotSpan.classList.add("dot-ext-access-denied");
            }
          } else {
            extAccessAllowedDotSpan.classList.add("dot-ext-access-not-configured");
          }
        extAccessAllowedTD.appendChild(extAccessAllowedDotSpan);
      dirItemTR.appendChild(extAccessAllowedTD);
    


      // Create Child Count element and add it to the row
      const countChildrenTD = document.createElement("td");
        countChildrenTD.classList.add("list-item-data");  // directory-list-item > list-item-data
        countChildrenTD.classList.add("list-item-count"); // directory-list-item > list-item-count
        countChildrenTD.classList.add("count-children");  // directory-list-item > count-children
        if (Number.isInteger(dirStats.count_children)) {
          countChildrenTD.appendChild( document.createTextNode( dirStats.count_children ) );
        }
      dirItemTR.appendChild(countChildrenTD);

      // Create Type Regular Count element and add it to the row
      const countTypeRegularTD = document.createElement("td");
        countTypeRegularTD.classList.add("list-item-data");     // directory-list-item > list-item-data
        countTypeRegularTD.classList.add("list-item-count");    // directory-list-item > list-item-count
        countTypeRegularTD.classList.add("count-type-regular"); // directory-list-item > count-type-regular
        if (Number.isInteger(dirStats.count_type_regular)) {
          countTypeRegularTD.appendChild( document.createTextNode( dirStats.count_type_regular ) );
        }
      dirItemTR.appendChild(countTypeRegularTD);

      // Create Type Directory Count element and add it to the row
      const countTypeDirectoryTD = document.createElement("td");
        countTypeDirectoryTD.classList.add("list-item-data");       // directory-list-item > list-item-data
        countTypeDirectoryTD.classList.add("list-item-count");      // directory-list-item > list-item-count
        countTypeDirectoryTD.classList.add("count-type-directory"); // directory-list-item > count-type-directory
        if (Number.isInteger(dirStats.count_type_directory)) {
          if (dirStats.count_type_directory > 0) {
            countTypeDirectoryTD.classList.add("list-item-warning"); // directory-list-item > list-item-warning
          }
          countTypeDirectoryTD.appendChild( document.createTextNode( dirStats.count_type_directory ) );
        }
      dirItemTR.appendChild(countTypeDirectoryTD);

      // Create Type Other Count element and add it to the row
      const countTypeOtherTD = document.createElement("td");
        countTypeOtherTD.classList.add("list-item-data");   // directory-list-item > list-item-data
        countTypeOtherTD.classList.add("list-item-count");  // directory-list-item > list-item-count
        countTypeOtherTD.classList.add("count-type-other"); // directory-list-item > count-type-other
        if (Number.isInteger(dirStats.count_type_other)) {
          if (dirStats.count_type_other > 0) {
            countTypeOtherTD.classList.add("list-item-caution"); // directory-list-item > list-item-caution
          }
          countTypeOtherTD.appendChild( document.createTextNode( dirStats.count_type_other ) );
        }
      dirItemTR.appendChild(countTypeOtherTD);

      // Create Type Unknown Count element and add it to the row
      const countTypeUnknownTD = document.createElement("td");
        countTypeUnknownTD.classList.add("list-item-data");     // directory-list-item > list-item-data
        countTypeUnknownTD.classList.add("list-item-count");    // directory-list-item > list-item-count
        countTypeUnknownTD.classList.add("count-type-unknown"); // directory-list-item > count-type-unknown
        if (Number.isInteger(dirStats.count_type_unknown)) {
          if (dirStats.count_type_unknown > 0) {
            countTypeUnknownTD.classList.add("list-item-caution"); // directory-list-item > list-item-caution
          }
          countTypeUnknownTD.appendChild( document.createTextNode( dirStats.count_type_unknown ) );
        }
      dirItemTR.appendChild(countTypeUnknownTD);

      // Create Type Error Count element and add it to the row
      const countTypeErrorTD = document.createElement("td");
        countTypeErrorTD.classList.add("list-item-data");   // directory-list-item > list-item-data
        countTypeErrorTD.classList.add("list-item-count");  // directory-list-item > list-item-count
        countTypeErrorTD.classList.add("count-type-error"); // directory-list-item > count-type-error
        if (Number.isInteger(dirStats.count_type_error)) {
          if (dirStats.count_type_error > 0) {
            countTypeErrorTD.classList.add("list-item-warning"); // directory-list-item > list-item-warning
          }
          countTypeErrorTD.appendChild( document.createTextNode( dirStats.count_type_error ) );
        }
      dirItemTR.appendChild(countTypeErrorTD);



      // Create Smallest Size element and add it to the row
      const sizeSmallestTD = document.createElement("td");
        sizeSmallestTD.classList.add("list-item-data"); // directory-list-item > list-item-data
        sizeSmallestTD.classList.add("list-item-size"); // directory-list-item > list-item-size
        sizeSmallestTD.classList.add("size-smallest");  // directory-list-item > size-smallest
        if (Number.isInteger(dirStats.size_smallest)) {
          sizeSmallestTD.appendChild( document.createTextNode( await messenger.messengerUtilities.formatFileSize(dirStats.size_smallest) ) );
        }
      dirItemTR.appendChild(sizeSmallestTD);

      // Create Size element and add it to the row
      const sizeLargestTD = document.createElement("td");
        sizeLargestTD.classList.add("list-item-data"); // directory-list-item > list-item-data
        sizeLargestTD.classList.add("list-item-size"); // directory-list-item > list-item-size
        sizeLargestTD.classList.add("size-largest");   // directory-list-item > size-largest
        if (Number.isInteger(dirStats.size_largest)) {
          sizeLargestTD.appendChild( document.createTextNode( await messenger.messengerUtilities.formatFileSize(dirStats.size_largest) ) );
        }
      dirItemTR.appendChild(sizeLargestTD);

      // Create Size element and add it to the row
      const sizeTotalTD = document.createElement("td");
        sizeTotalTD.classList.add("list-item-data"); // directory-list-item > list-item-data
        sizeTotalTD.classList.add("list-item-size"); // directory-list-item > list-item-size
        sizeTotalTD.classList.add("size-total");     // directory-list-item > size-total
        if (Number.isInteger(dirStats.size_total)) {
          sizeTotalTD.appendChild( document.createTextNode( await messenger.messengerUtilities.formatFileSize(dirStats.size_total) ) );
        }
      dirItemTR.appendChild(sizeTotalTD);



      // Create Earliest Child Creation Date/Time element and add it to the row
      const timeEarliestChildCreationTD = document.createElement("td");
        timeEarliestChildCreationTD.classList.add("list-item-data");               // directory-list-item > list-item-data
        timeEarliestChildCreationTD.classList.add("list-item-time");               // directory-list-item > list-item-time
        timeEarliestChildCreationTD.classList.add("time-child-creation-earliest"); // directory-list-item > time-child-creation-earliest
        if (Number.isInteger(dirStats.time_childCreation_earliest)) {
          timeEarliestChildCreationTD.appendChild( document.createTextNode( formatMsToDateTime24HR(dirStats.time_childCreation_earliest) ) );
        }
      dirItemTR.appendChild(timeEarliestChildCreationTD);

      // Create Latest Child Creation Date/Time element and add it to the row
      const timeLatestChildCreationTD = document.createElement("td");
        timeLatestChildCreationTD.classList.add("list-item-data");             // directory-list-item > list-item-data
        timeLatestChildCreationTD.classList.add("list-item-time");             // directory-list-item > list-item-time
        timeLatestChildCreationTD.classList.add("time-child-creation-latest"); // directory-list-item > time-child-creation-latest
        if (Number.isInteger(dirStats.time_childCreation_latest)) {
          timeLatestChildCreationTD.appendChild( document.createTextNode( formatMsToDateTime24HR(dirStats.time_childCreation_latest) ) );
        }
      dirItemTR.appendChild(timeLatestChildCreationTD);

      // Create Earliest Child Last Accessed Date/Time element and add it to the row
      const timeEarliestChildLastAccessTD = document.createElement("td");
        timeEarliestChildLastAccessTD.classList.add("list-item-data");                    // directory-list-item > list-item-data
        timeEarliestChildLastAccessTD.classList.add("list-item-time");                    // directory-list-item > list-item-time
        timeEarliestChildLastAccessTD.classList.add("time-child-last-accessed-earliest"); // directory-list-item > time-child-last-accessed-earliest
        if (Number.isInteger(dirStats.time_childLastAccessed_earliest)) {
          timeEarliestChildLastAccessTD.appendChild( document.createTextNode( formatMsToDateTime24HR(dirStats.time_childLastAccessed_earliest) ) );
        }
      dirItemTR.appendChild(timeEarliestChildLastAccessTD);

      // Create Latest Child Last Accessed Date/Time element and add it to the row
      const timeLatestChildLastAccessedTD = document.createElement("td");
        timeLatestChildLastAccessedTD.classList.add("list-item-data");                  // directory-list-item > list-item-data
        timeLatestChildLastAccessedTD.classList.add("list-item-time");                  // directory-list-item > list-item-time
        timeLatestChildLastAccessedTD.classList.add("time-child-last-accessed-latest"); // directory-list-item > time-child-last-accessed-latest
        if (Number.isInteger(dirStats.time_childLastAccessedTime_latest)) {
          timeLatestChildLastAccessedTD.appendChild( document.createTextNode( formatMsToDateTime24HR(dirStats.time_childLastAccessedTime_latest) ) );
        }
      dirItemTR.appendChild(timeLatestChildLastAccessedTD);

      // Create Earliest Child Last Modified Date/Time element and add it to the row
      const timeEarliestChildLastModifiedTD = document.createElement("td");
        timeEarliestChildLastModifiedTD.classList.add("list-item-data");                    // directory-list-item > list-item-data
        timeEarliestChildLastModifiedTD.classList.add("list-item-time");                    // directory-list-item > list-item-time
        timeEarliestChildLastModifiedTD.classList.add("time-child-last-modified-earliest"); // directory-list-item > time-child-last-modified-earliest
        if (Number.isInteger(dirStats.time_childLastModified_earliest)) {
          timeEarliestChildLastModifiedTD.appendChild( document.createTextNode( formatMsToDateTime24HR(dirStats.time_childLastModified_earliest) ) );
        }
      dirItemTR.appendChild(timeEarliestChildLastModifiedTD);

      // Create Latest Child Last Modified Date/Time element and add it to the row
      const timeLatestChildLastModifiedTD = document.createElement("td");
        timeLatestChildLastModifiedTD.classList.add("list-item-data");                  // directory-list-item > list-item-data
        timeLatestChildLastModifiedTD.classList.add("list-item-time");                  // directory-list-item > list-item-time
        timeLatestChildLastModifiedTD.classList.add("time-child-last-modified-latest"); // directory-list-item > time-child-last-modified-latest
        if (Number.isInteger(dirStats.time_childLastModified_latest)) {
          timeLatestChildLastModifiedTD.appendChild( document.createTextNode( formatMsToDateTime24HR(dirStats.time_childLastModified_latest) ) );
        }
      dirItemTR.appendChild(timeLatestChildLastModifiedTD);

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
    const dirName = button.getAttribute("dirname");
    const dirPath = button.getAttribute("dirpath");

    this.debug(`dirName="${dirName}" dirPath="${dirPath}"`);

    if (! dirName) {
      this.error("'button-delete-directory' Button does not have Attribute 'dirName'");
    } else if (! dirPath) {
      this.error("'button-delete-directory' Button does not have Attribute 'dirPath'");
    } else {
      await this.#deleteDirectory(dirName, dirPath);
    }
  }



  async #deleteDirectory(dirName, dirPath) {
    this.debug(`dirName="${dirName}" dirPath="${dirPath}"`);

//  const selector      = `tr.directory-list-item[dirpath='${dirPath}']`;
    const selector      = `tr.directory-list-item[dirname='${dirName}']`;
    const dirListItemTR = document.querySelector(selector);

    if (! dirListItemTR) {
      this.error(`Failed to select Directory List Item TR with selector: "${selector}"`);

    } else {
      const itemCount  = dirListItemTR.getAttribute( "itemcount"  );
      const installed  = dirListItemTR.getAttribute( "installed"  );
      const enabled    = dirListItemTR.getAttribute( "enabled"    );
      const configured = dirListItemTR.getAttribute( "configured" );
      const access     = dirListItemTR.getAttribute( "access"     );
      this.debug(`itemCount=${itemCount} installed=${installed} enabled=${enabled} configured=${configured} access=${access}`);

      const confirmed = await this.#showDeleteDirectoryConfirmDialog(dirName, dirPath, itemCount, installed, enabled, configured, access);

      if (! confirmed) {
        this.debug("The user chose to cancel directory deletion");
        this.#setMessageFor("fsbStatsManagerTitlePanel", "fsbStatsManager_message_directoryDeleteCanceled"); 

      } else {
        var   error    = false;
        var   deleted  = false;
        const response = await this.#fsBrokerApi.fsbDeleteDirectory( dirName, {'recursive': true} );

        if (! response) {
          this.error(`-- FAILED TO DELETE DIRECTORY -- NO RESPONSE RETURNED -- dirName="${dirName}"`);
          error = true;
        } else if (response.invalid) {
          this.error(`-- FAILED TO DELETE DIRECTORY -- INVALID RETURNED -- dirName="${dirName}": ${response.invalid}`); // MABXXX <---------- add response.invalid everywhere
          error = true;
        } else if (response.error) {
          this.error(`-- FAILED TO DELETE DIRECTORY -- ERROR RETURNED -- dirName="${dirName}": ${response.error}`); // MABXXX <-------------- add response.error everywhere
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
          dirListItemTR.remove();
        }

        if (error) {
          this.#setErrorFor("fsbStatsManagerTitlePanel", "fsbStatsManager_error_directoryDeleteFailed"); 
        }

        if (deleted) {
          this.#setMessageFor("fsbStatsManagerTitlePanel", "fsbStatsManager_message_directoryDeleted"); 
        }
      }
    }
  }



  async #showDeleteDirectoryConfirmDialog(dirName, dirPath, numItems, installed, enabled, configured, access) {
    const itemCount                = Number(numItems);
    const isExtensionInstalled     = (installed  === 'true') ? true : false;
    const isExtensionEnabled       = (enabled    === 'true') ? true : false;
    const isExtensionConfigured    = (configured === 'true') ? true : false;
    const isExtensionGrantedAccess = (access     === 'true') ? true : false;

    this.debug( "\n--- parameters:",
                `\n- dirName .................... "${dirName}"`,
                `\n- dirPath .................... "${dirPath}"`,
                `\n- itemCount .................. ${itemCount}`,
                `\n- isExtensionInstalled ....... ${isExtensionInstalled}`,
                `\n- isExtensionEnabled ......... ${isExtensionEnabled}`,
                `\n- isExtensionConfigured ...... ${isExtensionConfigured}`,
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

    const title           = getI18nMsg("fsbStatsManager_dialog_confirmDeleteDirectory_title");           // "Confirm Directory Deletion"
    const button1MsgId    = "fsbStatsManager_dialog_confirmDeleteDirectory_button_continue.label";
    const button2MsgId    = "fsbStatsManager_dialog_confirmDeleteDirectory_button_cancel.label";
    const messageContinue = getI18nMsg("fsbStatsManager_dialog_confirmDeleteDirectory_messageContinue"); // "Do you wish to continue?"

    var  confirmDialogUrl = messenger.runtime.getURL("../dialogs/confirm.html")
                             + `?windowName=${encodeURIComponent("DeleteDirectoryConfirmDialog")}`
                             + `&title=${encodeURIComponent(title)}`
                             + `&tc=${encodeURIComponent('yellow')}`
                             + "&buttons_3=false"
                             + `&button1MsgId=${encodeURIComponent(button1MsgId)}`
                             + `&button2MsgId=${encodeURIComponent(button2MsgId)}`;

    var msgNum  = 0;
    var message = '';

    message = getI18nMsgSubst("fsbStatsManager_dialog_confirmDeleteDirectory_dirName", dirName);
    confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
    confirmDialogUrl += `&w${msgNum}=${encodeURIComponent('bolder')}`

    confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(" ")}`

    if (! Number.isInteger(itemCount)) {
      // ???
    } else if (itemCount === 0) {
      message = getI18nMsg("fsbStatsManager_dialog_confirmDeleteDirectory_hasNoItems");
      confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
      confirmDialogUrl += `&a${msgNum}=${encodeURIComponent('left')}`
    } else if (itemCount === 1) {
      message = getI18nMsg("fsbStatsManager_dialog_confirmDeleteDirectory_hasOneItem");
      confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
      confirmDialogUrl += `&a${msgNum}=${encodeURIComponent('left')}`
      confirmDialogUrl += `&c${msgNum}=${encodeURIComponent('red')}`
    } else {
      message = getI18nMsgSubst("fsbStatsManager_dialog_confirmDeleteDirectory_hasNNItems", itemCount);
      confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
      confirmDialogUrl += `&a${msgNum}=${encodeURIComponent('left')}`
      confirmDialogUrl += `&c${msgNum}=${encodeURIComponent('red')}`
    }

    confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(" ")}`

    if (isExtensionInstalled) {
      message = getI18nMsg("fsbStatsManager_dialog_confirmDeleteDirectory_extensionInstalled");
      confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
      confirmDialogUrl += `&a${msgNum}=${encodeURIComponent('left')}`

      if (isExtensionEnabled) {
        message = getI18nMsg("fsbStatsManager_dialog_confirmDeleteDirectory_extensionEnabled");
        confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&a${msgNum}=${encodeURIComponent('left')}`
      } else {
        message = getI18nMsg("fsbStatsManager_dialog_confirmDeleteDirectory_extensionNotEnabled");
        confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&a${msgNum}=${encodeURIComponent('left')}`
      }
    } else {
      message = getI18nMsg("fsbStatsManager_dialog_confirmDeleteDirectory_extensionNotInstalled");
      confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
      confirmDialogUrl += `&a${msgNum}=${encodeURIComponent('left')}`
    }

    confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(" ")}`

    if (isExtensionConfigured) {
      message = getI18nMsg("fsbStatsManager_dialog_confirmDeleteDirectory_extensionConfigured");
      confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
      confirmDialogUrl += `&a${msgNum}=${encodeURIComponent('left')}`

      if (isExtensionGrantedAccess) {
        message = getI18nMsg("fsbStatsManager_dialog_confirmDeleteDirectory_extensionGrantedAccess");
        confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&a${msgNum}=${encodeURIComponent('left')}`
      } else {
        message = getI18nMsg("fsbStatsManager_dialog_confirmDeleteDirectory_extensionNotGrantedAccess");
        confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
        confirmDialogUrl += `&a${msgNum}=${encodeURIComponent('left')}`
      }
    } else {
      message = getI18nMsg("fsbStatsManager_dialog_confirmDeleteDirectory_extensionNotConfigured");
      confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(message)}`
      confirmDialogUrl += `&a${msgNum}=${encodeURIComponent('left')}`
    }

    confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(" ")}`;                // empty line

    confirmDialogUrl += `&message${++msgNum}=${encodeURIComponent(messageContinue)}`;
    confirmDialogUrl += `&w${msgNum}=${encodeURIComponent('bold')}`;

    confirmDialogUrl += `&c=${encodeURIComponent(msgNum)}`;

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

    const confirmDialogResponse = await this.#confirmDeleteDirectoryDialogPrompt(confirmDialogWindow.id, focusListener, null);
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

      function windowRemovedListener(windowId) {
        if (windowId == confirmDialogWindowId) {

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
        if (sender.tab && sender.tab.windowId == confirmDialogWindowId && request && request.hasOwnProperty("ConfirmDialogResponse")) {
          response = request.ConfirmDialogResponse;
        }

        return false; // we're not sending any response 
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }




  async #getFsbStats() {
    let fsbStatsResponse;
    try {
      fsbStatsResponse = await this.#fsBrokerApi.fsbStats();
      this.debug( "\n\n========================\nfsbStatsResponse:\n", fsbStatsResponse, "\n========================\n\n" );
    } catch (error) {
      this.caught(error, "-- getFsbStats");
    }

    if (! fsbStatsResponse) {
      this.error("-- fsbStats -- NO RESPONSE");
    } else if (fsbStatsResponse.invalid) {
      this.error(`-- fsbStats -- FSB STATS ERROR: ${fsbStatsResponse.invalid}`);
    } else if (fsbStatsResponse.error) {
      this.error(`-- fsbStats -- FSB STATS ERROR: ${fsbStatsResponse.error}`);
    } else if (! fsbStatsResponse.stats) {
      this.error("-- fsbStats -- NO STATS RETURNED");
    } else if (! fsbStatsResponse.stats.fsbStats) {
      this.error("-- fsbStats -- NO FSB_STATS RETURNED");
    } else if (! fsbStatsResponse.stats.dirStats) {
      this.error("-- fsbStats -- NO DIR_STATS RETURNED");
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

    if (e.target.tagName == "TR" || e.target.tagName == "TD") {
      this.debug("-- TR or TD Clicked");

      let trElement = e.target;
      if (e.target.tagName == "TD") {
        trElement = e.target.closest('tr');
      }

      if (! trElement) {
        this.debug("-- Did NOT get our TR");

      } else {
        this.debug(  "-- Got our TR --"
                    + ` directory-list-item? ${trElement.classList.contains("directory-list-item")}`
                  );
        if (trElement.classList.contains("directory-list-item")) {
          const dirName     = trElement.getAttribute("dirname");
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
    const domDirectoryList = document.getElementById("fsbStatsManagerDirectoryList");
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
    const domDirectoryList = document.getElementById("fsbStatsManagerDirectoryList");
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
    const domDirectoryList = document.getElementById("fsbStatsManagerDirectoryList");
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
    const domDirectoryList = document.getElementById("fsbStatsManagerDirectoryList");

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



  async #refreshButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    const refreshBtn = document.getElementById("fsbStatsManagerRefreshButton");
    if (! refreshBtn) {
      this.error("Failed to get element '#fsbStatsManagerRefreshButton'");
    } else {
      refreshBtn.disabled = true;
    }

    await this.#buildUI();

    this.#updateUIOnSelectionChanged();

    if (refreshBtn) refreshBtn.disabled = false;
  }



  #resetMessages() {
    let msgPanelDivs = document.querySelectorAll("div.messages-panel"); // <--------------- NOTE: messages-panel - same as for #resetErrors(), but different attribute
    if (msgPanelDivs) {
      for (let msgPanelDiv of msgPanelDivs) {
        msgPanelDiv.setAttribute("msg", "false"); // <------------------------------------- different from #resetErrors();
      }
    }

    let msgDivs = document.querySelectorAll("div.stats-msg");
    if (msgDivs) {
      for (let msgDiv of msgDivs) {
        msgDiv.setAttribute("msg", "false");
      }
    }

    let msgLabels = document.querySelectorAll("label.stats-msg-text");
    if (msgLabels) {
      for (let msgLabel of msgLabels) {
        msgLabel.setAttribute("msg", "false");
        msgLabel.innerText = ""; // MABXXX THIS IS A HUGE LESSON:  DO NOT USE: <label/>   USE: <label></label> 
      }
    }
  }

  /* there can be no more than one message per elementId */
  #setMessageFor(elementId, msgId, parms) {
    var i18nMessage;
    if (parms !== null && parms !== undefined) {
      i18nMessage = getI18nMsgSubst(msgId, parms);
    } else {
      i18nMessage = getI18nMsg(msgId);
    }
    
    if (i18nMessage) {
      if (elementId && msgId) {
        const messagesPanelDivSelector = `div.messages-panel[messages-for='${elementId}']`;
        const messagesPanelDiv = document.querySelector(messagesPanelDivSelector);
        if (messagesPanelDiv) {
          messagesPanelDiv.setAttribute("msg", "true");
        }

        const divSelector = `div.stats-msg[msg-for='${elementId}']`;
        const msgDiv = document.querySelector(divSelector);
        if (msgDiv) {
          msgDiv.setAttribute("msg", "true");
        }

        const labelSelector = `label.stats-msg-text[msg-for='${elementId}']`;
        const msgLabel = document.querySelector(labelSelector);
        if (msgLabel) {
          msgLabel.setAttribute("msg", "true");
          msgLabel.innerText = i18nMessage;
        }
      }
    }
  }



  #resetErrors() {
    let msgPanelDivs = document.querySelectorAll("div.messages-panel"); // <--------------- NOTE: messages-panel - same as for #resetMessages(), but different attribute
    if (msgPanelDivs) {
      for (let msgPanelDiv of msgPanelDivs) {
        msgPanelDiv.setAttribute("error", "false"); // <----------------------------------- different from #resetMessages();
      }
    }

    let errorDivs = document.querySelectorAll("div.stats-error");
    if (errorDivs) {
      for (let errorDiv of errorDivs) {
        errorDiv.setAttribute("error", "false");
      }
    }

    let errorLabels = document.querySelectorAll("label.stats-error-text");
    if (errorLabels) {
      for (let errorLabel of errorLabels) {
        errorLabel.setAttribute("error", "false");
        errorLabel.innerText = ""; // MABXXX THIS IS A HUGE LESSON:  DO NOT USE: <label/>   USE: <label></label> 
      }
    }
  }

  /* there can be no more than one error message per elementId */
  #setErrorFor(elementId, msgId, parms) {
    var i18nMessage;
    if (parms) {
      i18nMessage = getI18nMsgSubst(msgId, parms);
    } else {
      i18nMessage = getI18nMsg(msgId);
    }

    if (i18nMessage) {
      if (elementId && msgId) {
        const divPanelSelector = `div.messages-panel[messages-for='${elementId}']`;
        const msgPanelDiv = document.querySelector(divPanelSelector);
        if (msgPanelDiv) {
          msgPanelDiv.setAttribute("error", "true");
        }

        let errorDiv = document.querySelector("div.stats-error[error-for='" + elementId + "']");
        if (errorDiv) {
          errorDiv.setAttribute("error", "true");
        }

        let errorLabel = document.querySelector("label.stats-error-text[error-for='" + elementId + "']");
        if (errorLabel) {
          errorLabel.setAttribute("error", "true");
          errorLabel.innerText = i18nMessage;
        }
      }
    }
  }



  async #doneButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    this.#canceled = true;

    let responseMessage = "DONE";
    this.debug(`-- Sending responseMessage="${responseMessage}"`);

    try {
      await messenger.runtime.sendMessage(
        { StatsManagerResponse: responseMessage }
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



const directoryManager = new StatsManager();

document.addEventListener("DOMContentLoaded", (e) => directoryManager.run(e), {once: true});
