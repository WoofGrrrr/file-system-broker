import { Logger              } from '../modules/logger.js';
import { FsbOptions          } from '../modules/options.js';
import { FileSystemBrokerAPI } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { getI18nMsg, getI18nMsgSubst, formatMsToDateTime24HR , formatMsToDateTime12HR } from '../modules/utilities.js';




class StatsManager {
  #CLASS_NAME    = this.constructor.name;

  #INFO          = false;
  #LOG           = false;
  #DEBUG         = false;
  #WARN          = false;

  #logger        = new Logger();
  #fsbOptionsApi = new FsbOptions(this.logger);
  #fsBrokerApi   = new FileSystemBrokerAPI();

  //// don't need to do any of this this because we aren't using options that need FsbEventLogger
//fsbCommandsApi = new FileSystemBrokerCommands(this.logger, this.fsbOptionsApi);
//fsbEventLogger = new FsbEventLogger(this.logger, this.fsbOptionsApi, this.fsbCommandsApi); // <---- this is why we new fsbCommandsApi 
//#fsbOptionsApi.setEventLogger(this.#fsbEventLogger);
//fsbCommandsApi.setEventLogger(this.fsbEventLogger);
  

  #canceled      = false;

  #listHeaderText_dirName                    = getI18nMsg( "fsbStatsManager_directoryListHeader_directoryName",              "Name"           );
  #listHeaderText_extensionId                = getI18nMsg( "fsbStatsManager_directoryListHeader_extensionId",                "Extension ID"   );
  #listHeaderText_extensionEnabled           = getI18nMsg( "fsbStatsManager_directoryListHeader_extensionEnabled",           "E?"             );
  #listHeaderText_extensionConfigured        = getI18nMsg( "fsbStatsManager_directoryListHeader_extensionConfigured",        "C?"             );
  #listHeaderText_extensionAccessAllowed     = getI18nMsg( "fsbStatsManager_directoryListHeader_extensionAccessAllowed",     "A?"             );

  #listHeaderText_count_children             = getI18nMsg( "fsbStatsManager_directoryListHeader_count_children",             "#Items"         );
  #listHeaderText_count_regular              = getI18nMsg( "fsbStatsManager_directoryListHeader_count_type_regular",         "#Regular"       );
  #listHeaderText_count_directory            = getI18nMsg( "fsbStatsManager_directoryListHeader_count_type_directory",       "#Directory"     );
  #listHeaderText_count_other                = getI18nMsg( "fsbStatsManager_directoryListHeader_count_type_other",           "#Other"         );
  #listHeaderText_count_unknown              = getI18nMsg( "fsbStatsManager_directoryListHeader_count_type_unknown",         "#Unknown"       );
  #listHeaderText_count_error                = getI18nMsg( "fsbStatsManager_directoryListHeader_count_type_error",           "#Error"         );

  #listHeaderText_time_creation_earliest     = getI18nMsg( "fsbStatsManager_directoryListHeader_time_creation_earliest",     ""               );
  #listHeaderText_time_creation_latest       = getI18nMsg( "fsbStatsManager_directoryListHeader_time_creation_latest",       ""               );
  #listHeaderText_time_lastAccessed_earliest = getI18nMsg( "fsbStatsManager_directoryListHeader_time_lastAccessed_earliest", ""               );
  #listHeaderText_time_lastAccessed_latest   = getI18nMsg( "fsbStatsManager_directoryListHeader_time_lastAccessed_latest",   ""               );
  #listHeaderText_time_lastModified_earliest = getI18nMsg( "fsbStatsManager_directoryListHeader_time_lastModified_earliest", ""               );
  #listHeaderText_time_lastModified_latest   = getI18nMsg( "fsbStatsManager_directoryListHeader_time_lastModified_latest",   ""               );

  #listHeader_size_smallest                  = getI18nMsg( "fsbStatsManager_directoryListHeader_size_smallest",              ""               );
  #listHeader_size_largest                   = getI18nMsg( "fsbStatsManager_directoryListHeader_size_largest",               ""               );
  #listHeader_size_total                     = getI18nMsg( "fsbStatsManager_directoryListHeader_size_total",                 ""               );



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

    window.addEventListener("beforeunload", (e) => this.windowUnloading(e));

    const showInstructions = await this.#fsbOptionsApi.isEnabledShowStatsManagerInstructions();
    this.showHideInstructions(showInstructions);

    await this.updateOptionsUI();
//  await updateStatsManagerUI() {
    await this.localizePage();
    await this.buildDirectoryListUI();
    this.setupEventListeners();
  }



  setupEventListeners() {
    document.addEventListener( "change", (e) => this.optionChanged(e) );   // One of the checkboxes or radio buttons was clicked or a select has changed

    const doneBtn = document.getElementById("fsbStatsManagerDoneButton");
    if (! doneBtn) {
      this.error("Failed to get element '#fsbStatsManagerDoneButton'");
    } else {
      doneBtn.addEventListener("click", (e) => this.doneButtonClicked(e));
    }

    const refreshBtn = document.getElementById("fsbStatsManagerRefreshButton");
    if (! refreshBtn) {
      this.error("Failed to get element '#fsbStatsManagerRefreshButton'");
    } else {
      refreshBtn.addEventListener("click", (e) => this.refreshButtonClicked(e));
    }

    const deleteBtn = document.getElementById("fsbStatsManagerDeleteButton");
    if (! deleteBtn) {
      this.error("Failed to get element '#fsbStatsManagerDeleteButton'");
    } else {
      deleteBtn.addEventListener("click", (e) => this.deleteButtonClicked(e));
    }
  }



  async localizePage() {
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



  async updateOptionsUI() {
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
  async optionChanged(e) {
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
            this.showHideInstructions(optionValue);
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



  showHideInstructions(show) {
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
  


  async updateStatsManagerUI() {
  }
  


  async windowUnloading(e) {
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



  async buildDirectoryListUI() {
    this.resetMessages();
    this.resetErrors();

    const domDirectoryList = document.getElementById("fsbStatsManagerDirectoryList");
    if (! domDirectoryList) {
      this.error("-- failed to get element #fsbStatsManagerDirectoryList");
      this.setErrorFor("fsbStatsManagerTitlePanel", fsbStatsManager_error_noDirectoryListElement);
      return;
    }

    domDirectoryList.innerHTML = '';
    this.updateUIOnSelectionChanged();

    const i18nMessage = getI18nMsg("fsbStatsManager_message_directoryListLoading", "...");
    const loadingTR = document.createElement("tr");
    loadingTR.classList.add("stats-loading");
    loadingTR.appendChild( document.createTextNode(i18nMessage) ); // you can put a text node in a TR ???
    domDirectoryList.appendChild(loadingTR);

    // MABXXX THIS RETURNS ONLY THE 'stats' array!!!
    const fsbStats = await this.getFsbStats();
    this.debug("---fsbStats\n", fsbStats);

    domDirectoryList.innerHTML = '';

    const headerItemUI = this.buildDirectoryListHeaderUI();
    domDirectoryList.append(headerItemUI);

    if (! fsbStats) {
      this.error("---NO fsbStats");
      this.setErrorFor("fsbStatsManagerTitlePanel", fsbStatsManager_error_noDirectories);
    } else if (Object.keys(fsbStats).length < 1) {
      this.error("---fsbStats.length < 1");
      this.setErrorFor("fsbStatsManagerTitlePanel", fsbStatsManager_error_noDirectories);
    } else {
      const installedExtensions = await messenger.management.getAll(); // MABXXX #fsbOptions.getExtenionsProps() returns .installed, no???
      const extensionsProps     = await this.#fsbOptionsApi.getExtensionsProps();;
      const sortedKeys          = Object.keys(fsbStats).sort((a, b) => { return a.localeCompare( b, undefined, {'sensitivity': 'base'} ) } );

      for (const key of sortedKeys) {
        const dirStats        = fsbStats[key];
        var   extensionInfo  = null;
        var   extensionProps = null;

        if (installedExtensions) {
          extensionInfo = installedExtensions.find( extension =>
            {
              return (extension.type === 'extension' && extension.id === dirStats.dirName);
            }
          );  
          this.debug("---extensionInfo\n", extensionInfo);
        }

        if (extensionsProps) {
          extensionProps = (extensionsProps && dirStats.dirName in extensionsProps) ? extensionsProps[dirStats.dirName] : null;
          this.debugAlways("---extensionProps\n", extensionProps);
        }

        const listItemUI = await this.buildDirectoryListItemUI(dirStats, extensionInfo, extensionProps);
        domDirectoryList.append(listItemUI);
      }
    }
  }



  buildDirectoryListHeaderUI() {
    this.debug("-- BUILD LIST HEADER UI");

    const dirHeaderTR = document.createElement("tr");
      dirHeaderTR.classList.add("directory-list-header"); // directory-list-header

      // Create Directory Name element and add it to the row
      const dirNameTH = document.createElement("th");
        dirNameTH.classList.add("list-header-data");  // directory-list-header > list-header-data
        dirNameTH.classList.add("header-name");       // directory-list-header > header-name
        dirNameTH.appendChild( document.createTextNode(this.#listHeaderText_dirName) );
      dirHeaderTR.appendChild(dirNameTH);

      // Create Extension ID element and add it to the row
      const extIdTH = document.createElement("th");
        extIdTH.classList.add("list-header-data");  // directory-list-header > list-header-data
        extIdTH.classList.add("header-ext-id");    // directory-list-header > header-ext-id
        extIdTH.appendChild( document.createTextNode(this.#listHeaderText_extensionId) );
      dirHeaderTR.appendChild(extIdTH);

      // Create Extension Enabled element and add it to the row
      const extEnablesTH = document.createElement("th");
        extEnablesTH.classList.add("list-header-data");     // directory-list-header > list-header-data
        extEnablesTH.classList.add("header-ext-enabled");  // directory-list-header > header-ext-enabled //MABXXX ADD TO CSS
        extEnablesTH.appendChild( document.createTextNode(this.#listHeaderText_extensionEnabled) );
      dirHeaderTR.appendChild(extEnablesTH);

      // Create Extension Configured element and add it to the row
      const extConfiguredTH = document.createElement("th");
        extConfiguredTH.classList.add("list-header-data");        // directory-list-header > list-header-data
        extConfiguredTH.classList.add("header-ext-configured");  // directory-list-header > header-ext-configured //MABXXX ADD TO CSS
        extConfiguredTH.appendChild( document.createTextNode(this.#listHeaderText_extensionConfigured) );
      dirHeaderTR.appendChild(extConfiguredTH);

      // Create Extension Access Allowed element and add it to the row
      const extAccessAllowedTH = document.createElement("th");
        extAccessAllowedTH.classList.add("list-header-data");        // directory-list-header > list-header-data
        extAccessAllowedTH.classList.add("header-ext-configured");  // directory-list-header > header-ext-configured //MABXXX ADD TO CSS
        extAccessAllowedTH.appendChild( document.createTextNode(this.#listHeaderText_extensionAccessAllowed) );
      dirHeaderTR.appendChild(extAccessAllowedTH);

      // Create Child Count element and add it to the row
      const childCountTH = document.createElement("th");
        childCountTH.classList.add("list-header-data");       // directory-list-header > list-header-data
        childCountTH.classList.add("header-count-children");  // directory-list-header > header-count-children
        childCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_children) );
      dirHeaderTR.appendChild(childCountTH);

      // Create Child Type egular' Count element and add it to the row
      const regularCountTH = document.createElement("th");
        regularCountTH.classList.add("list-header-data");      // directory-list-header > list-header-data
        regularCountTH.classList.add("header-count-regular");  // directory-list-header > header-count-regular
        regularCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_regular) );
      dirHeaderTR.appendChild(regularCountTH);

      // Create Child Type 'directory' Count element and add it to the row
      const directoryCountTH = document.createElement("th");
        directoryCountTH.classList.add("list-header-data");        // directory-list-header > list-header-data
        directoryCountTH.classList.add("header-count-directory");  // directory-list-header > header-count-directory
        directoryCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_directory) );
      dirHeaderTR.appendChild(directoryCountTH);

      // Create Child Type 'other' Count element and add it to the row
      const otherCountTH = document.createElement("th");
        otherCountTH.classList.add("list-header-data");    // directory-list-header > list-header-data
        otherCountTH.classList.add("header-count-other");  // directory-list-header > header-count-other
        otherCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_other) );
      dirHeaderTR.appendChild(otherCountTH);

      // Create Child Type unknown Count element and add it to the row
      const unknownCountTH = document.createElement("th");
        unknownCountTH.classList.add("list-header-data");      // directory-list-header > list-header-data
        unknownCountTH.classList.add("header-count-unknown");  // directory-list-header > header-count-unknown
        unknownCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_unknown) );
      dirHeaderTR.appendChild(unknownCountTH);

      // Create Child Type error Count element and add it to the row
      const errorCountTH = document.createElement("th");
        errorCountTH.classList.add("list-header-data");    // directory-list-header > list-header-data
        errorCountTH.classList.add("header-count-error");  // directory-list-header > header-count-error
        errorCountTH.appendChild( document.createTextNode(this.#listHeaderText_count_error) );
      dirHeaderTR.appendChild(errorCountTH);

      // Create Earliest Creation Time element and add it to the row
      const timeCreationEarliestTH = document.createElement("th");
        timeCreationEarliestTH.classList.add("list-header-data");               // directory-list-header > list-header-data
        timeCreationEarliestTH.classList.add("header-time-creation-earliest");  // directory-list-header > header-time-creation-earliest
        timeCreationEarliestTH.appendChild( document.createTextNode(this.#listHeaderText_time_creation_earliest) );
      dirHeaderTR.appendChild(timeCreationEarliestTH);

      // Create Latest Creation Time element and add it to the row
      const timeCreationLatestTH = document.createElement("th");
        timeCreationLatestTH.classList.add("list-header-data");             // directory-list-header > list-header-data
        timeCreationLatestTH.classList.add("header-time-creation-latest");  // directory-list-header > header-time-creation-latest
        timeCreationLatestTH.appendChild( document.createTextNode(this.#listHeaderText_time_creation_latest) );
      dirHeaderTR.appendChild(timeCreationLatestTH);

      // Create Earliest Last Accessed Time element and add it to the row
      const timeLastAccessedEarliestTH = document.createElement("th");
        timeLastAccessedEarliestTH.classList.add("list-header-data");                     // directory-list-header > list-header-data
        timeLastAccessedEarliestTH.classList.add("header-time-last-accessed-earliest");   // directory-list-header > header-time-last-accessed-earliest
        timeLastAccessedEarliestTH.appendChild( document.createTextNode(this.#listHeaderText_time_lastAccessed_earliest) );
      dirHeaderTR.appendChild(timeLastAccessedEarliestTH);

      // Create Latest Last Accessed Time element and add it to the row
      const timeLastAccessedLatestTH = document.createElement("th");
        timeLastAccessedLatestTH.classList.add("list-header-data");                  // directory-list-header > list-header-data
        timeLastAccessedLatestTH.classList.add("header-time-last-accessed-latest");  // directory-list-header > header-time-last-accessed-latest
        timeLastAccessedLatestTH.appendChild( document.createTextNode(this.#listHeaderText_time_lastAccessed_latest) );
      dirHeaderTR.appendChild(timeLastAccessedLatestTH);

      // Create Earliest Last Modified Time element and add it to the row
      const timeLastModifiedEarliestTH = document.createElement("th");
        timeLastModifiedEarliestTH.classList.add("list-header-data");                    // directory-list-header > list-header-data
        timeLastModifiedEarliestTH.classList.add("header-time-last-modified-earliest");  // directory-list-header > header-time-last-modified-earliest
        timeLastModifiedEarliestTH.appendChild( document.createTextNode(this.#listHeaderText_time_lastModified_earliest) );
      dirHeaderTR.appendChild(timeLastModifiedEarliestTH);

      // Create Latest Last Modified Time element and add it to the row
      const timeLastModifiedLatestTH = document.createElement("th");
        timeLastModifiedLatestTH.classList.add("list-header-data");                  // directory-list-header > list-header-data
        timeLastModifiedLatestTH.classList.add("header-time-last-modified-latest");  // directory-list-header > header-time-last-modified-latest
        timeLastModifiedLatestTH.appendChild( document.createTextNode(this.#listHeaderText_time_lastModified_latest) );
      dirHeaderTR.appendChild(timeLastModifiedLatestTH);

      // Create Smallest Size element and add it to the row
      const sizeSmallestTH = document.createElement("th");
        sizeSmallestTH.classList.add("list-header-data");     // directory-list-header > list-header-data
        sizeSmallestTH.classList.add("header-size-smallest"); // directory-list-header > header-size-smallest
        sizeSmallestTH.appendChild( document.createTextNode(this.#listHeader_size_smallest) );
      dirHeaderTR.appendChild(sizeSmallestTH);

      // Create Largest Size element and add it to the row
      const sizeLargestTH = document.createElement("th");
        sizeLargestTH.classList.add("list-header-data");     // directory-list-header > list-header-data
        sizeLargestTH.classList.add("header-size-largest");  // directory-list-header > header-size-largest
        sizeLargestTH.appendChild( document.createTextNode(this.#listHeader_size_largest) );
      dirHeaderTR.appendChild(sizeLargestTH);

      // Create Total Size element and add it to the row
      const sizeTotalTH = document.createElement("th");
        sizeTotalTH.classList.add("list-header-data");   // directory-list-header > list-header-data
        sizeTotalTH.classList.add("header-size-totel");  // directory-list-header > header-size-totel
        sizeTotalTH.appendChild( document.createTextNode(this.#listHeader_size_total) );
      dirHeaderTR.appendChild(sizeTotalTH);

    return dirHeaderTR;
  }  



  // async just because of formatFileSize()
  async buildDirectoryListItemUI(dirStats, extensionInfo, extensionProps) {
    /*
     * dirStats
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
    this.debug(`BUILD DIRETORY LIST ITEM UI: --- dirStats:\n`, dirStats);

    const dirItemTR = document.createElement("tr");
      dirItemTR.classList.add("directory-list-item");             // directory-list-item
      dirItemTR.setAttribute("dirName", dirStats.dirName);
      dirItemTR.addEventListener("click", (e) => this.directoryListItemClicked(e));

      // Create Directory Name element and add it to the row
      const dirNameTD = document.createElement("td");
        dirNameTD.classList.add("list-item-data"); // directory-list-item > list-item-data
        dirNameTD.classList.add("list-item-name"); // directory-list-item > list-item-name
        dirNameTD.appendChild( document.createTextNode(dirStats.dirName) );
      dirItemTR.appendChild(dirNameTD);

      // Create Extension ID element and add it to the row
      const extIdTD = document.createElement("td");
        extIdTD.classList.add("list-item-data");   // directory-list-item > list-item-data
        extIdTD.classList.add("list-item-ext-id"); // directory-list-item > list-item-ext-id
        if (extensionInfo) {
          extIdTD.appendChild( document.createTextNode(extensionInfo.id) );
        }
      dirItemTR.appendChild(extIdTD);

      // Create Extension Enabled element and add it to the row
      const extEnabledTD = document.createElement("td");
        extEnabledTD.classList.add("list-item-data");        // directory-list-item > list-item-data
        extEnabledTD.classList.add("list-item-ext-enabled"); // directory-list-item > list-item-ext-enabled //MABXXX ADD TO CSS
        if (extensionInfo) {
          extEnabledTD.appendChild( document.createTextNode(! extensionInfo.disabled) );
        }
      dirItemTR.appendChild(extEnabledTD);

      // Create Extension Configured element and add it to the row
      const extConfiguredTD = document.createElement("td");
        extConfiguredTD.classList.add("list-item-data");           // directory-list-item > list-item-data
        extConfiguredTD.classList.add("list-item-ext-configured"); // directory-list-item > list-item-ext-configured //MABXXX ADD TO CSS
        if (extensionProps) {
          extConfiguredTD.appendChild( document.createTextNode("true") );
        } else {
          extConfiguredTD.appendChild( document.createTextNode("false") );
        }
      dirItemTR.appendChild(extConfiguredTD);

      // Create Extension AccessAllowed element and add it to the row
      const extAccessAllowedTD = document.createElement("td");
        extAccessAllowedTD.classList.add("list-item-data");               // directory-list-item > list-item-data
        extAccessAllowedTD.classList.add("list-item-ext-access-allowed"); // directory-list-item > list-item-ext-access-allowed //MABXXX ADD TO CSS
        if (extensionProps) {
          extAccessAllowedTD.appendChild( document.createTextNode(extensionProps.allowAccess) );
        } else {
//        extAccessAllowedTD.appendChild( document.createTextNode("false") );
        }
      dirItemTR.appendChild(extAccessAllowedTD);
    


      // Create Child Count element and add it to the row
      const countChildrenTD = document.createElement("td");
        countChildrenTD.classList.add("list-item-data");  // directory-list-item > list-item-data
        countChildrenTD.classList.add("list-item-count"); // directory-list-item > list-item-count
        countChildrenTD.classList.add("count-children");  // directory-list-item > count-children
        countChildrenTD.appendChild( document.createTextNode( dirStats.count_children ) );
      dirItemTR.appendChild(countChildrenTD);

      // Create Type Regular Count element and add it to the row
      const countTypeRegularTD = document.createElement("td");
        countTypeRegularTD.classList.add("list-item-data");     // directory-list-item > list-item-data
        countTypeRegularTD.classList.add("list-item-count");    // directory-list-item > list-item-count
        countTypeRegularTD.classList.add("count-type-regular"); // directory-list-item > count-type-regular
        countTypeRegularTD.appendChild( document.createTextNode( dirStats.count_type_regular ) );
      dirItemTR.appendChild(countTypeRegularTD);

      // Create Type Directory Count element and add it to the row
      const countTypeDirectoryTD = document.createElement("td");
        countTypeDirectoryTD.classList.add("list-item-data");       // directory-list-item > list-item-data
        countTypeDirectoryTD.classList.add("list-item-count");      // directory-list-item > list-item-count
        countTypeDirectoryTD.classList.add("count-type-directory"); // directory-list-item > count-type-directory
        countTypeDirectoryTD.appendChild( document.createTextNode( dirStats.count_type_directory ) );
      dirItemTR.appendChild(countTypeDirectoryTD);

      // Create Type Other Count element and add it to the row
      const countTypeOtherTD = document.createElement("td");
        countTypeOtherTD.classList.add("list-item-data");   // directory-list-item > list-item-data
        countTypeOtherTD.classList.add("list-item-count");  // directory-list-item > list-item-count
        countTypeOtherTD.classList.add("count-type-other"); // directory-list-item > count-type-other
        countTypeOtherTD.appendChild( document.createTextNode( dirStats.count_type_other ) );
      dirItemTR.appendChild(countTypeOtherTD);

      // Create Type Unknown Count element and add it to the row
      const countTypeUnknownTD = document.createElement("td");
        countTypeUnknownTD.classList.add("list-item-data");     // directory-list-item > list-item-data
        countTypeUnknownTD.classList.add("list-item-count");    // directory-list-item > list-item-count
        countTypeUnknownTD.classList.add("count-type-unknown"); // directory-list-item > count-type-unknown
        countTypeUnknownTD.appendChild( document.createTextNode( dirStats.count_type_unknown ) );
      dirItemTR.appendChild(countTypeUnknownTD);

      // Create Type Error Count element and add it to the row
      const countTypeErrorTD = document.createElement("td");
        countTypeErrorTD.classList.add("list-item-data");   // directory-list-item > list-item-data
        countTypeErrorTD.classList.add("list-item-count");  // directory-list-item > list-item-count
        countTypeErrorTD.classList.add("count-type-error"); // directory-list-item > count-type-error
        countTypeErrorTD.appendChild( document.createTextNode( dirStats.count_type_error ) );
      dirItemTR.appendChild(countTypeErrorTD);



      // Create Earliest Child Creation Date/Time element and add it to the row
      const timeEarliestChildCreationTD = document.createElement("td");
        timeEarliestChildCreationTD.classList.add("list-item-data");               // directory-list-item > list-item-data
        timeEarliestChildCreationTD.classList.add("list-item-time");               // directory-list-item > list-item-time
        timeEarliestChildCreationTD.classList.add("time-child-creation-earliest"); // directory-list-item > time-child-creation-earliest
        timeEarliestChildCreationTD.appendChild( document.createTextNode( formatMsToDateTime24HR(dirStats.time_childCreation_earliest) ) );
      dirItemTR.appendChild(timeEarliestChildCreationTD);

      // Create Latest Child Creation Date/Time element and add it to the row
      const timeLatestChildCreationTD = document.createElement("td");
        timeLatestChildCreationTD.classList.add("list-item-data");             // directory-list-item > list-item-data
        timeLatestChildCreationTD.classList.add("list-item-time");             // directory-list-item > list-item-time
        timeLatestChildCreationTD.classList.add("time-child-creation-latest"); // directory-list-item > time-child-creation-latest
        timeLatestChildCreationTD.appendChild( document.createTextNode( formatMsToDateTime24HR(dirStats.time_childCreation_latest) ) );
      dirItemTR.appendChild(timeLatestChildCreationTD);

      // Create Earliest Child Last Accessed Date/Time element and add it to the row
      const timeEarliestChildLastAccessTD = document.createElement("td");
        timeEarliestChildLastAccessTD.classList.add("list-item-data");                    // directory-list-item > list-item-data
        timeEarliestChildLastAccessTD.classList.add("list-item-time");                    // directory-list-item > list-item-time
        timeEarliestChildLastAccessTD.classList.add("time-child-last-accessed-earliest"); // directory-list-item > time-child-last-accessed-earliest
        timeEarliestChildLastAccessTD.appendChild( document.createTextNode( formatMsToDateTime24HR(dirStats.time_childLastAccessed_earliest) ) );
      dirItemTR.appendChild(timeEarliestChildLastAccessTD);

      // Create Latest Child Last Accessed Date/Time element and add it to the row
      const timeLatestChildLastAccessedTD = document.createElement("td");
        timeLatestChildLastAccessedTD.classList.add("list-item-data");                  // directory-list-item > list-item-data
        timeLatestChildLastAccessedTD.classList.add("list-item-time");                  // directory-list-item > list-item-time
        timeLatestChildLastAccessedTD.classList.add("time-child-last-accessed-latest"); // directory-list-item > time-child-last-accessed-latest
        timeLatestChildLastAccessedTD.appendChild( document.createTextNode( formatMsToDateTime24HR(dirStats.time_childLastAccessedTime_latest) ) );
      dirItemTR.appendChild(timeLatestChildLastAccessedTD);

      // Create Earliest Child Last Modified Date/Time element and add it to the row
      const timeEarliestChildLastModifiedTD = document.createElement("td");
        timeEarliestChildLastModifiedTD.classList.add("list-item-data");                    // directory-list-item > list-item-data
        timeEarliestChildLastModifiedTD.classList.add("list-item-time");                    // directory-list-item > list-item-time
        timeEarliestChildLastModifiedTD.classList.add("time-child-last-modified-earliest"); // directory-list-item > time-child-last-modified-earliest
        timeEarliestChildLastModifiedTD.appendChild( document.createTextNode( formatMsToDateTime24HR(dirStats.time_childLastModified_earliest) ) );
      dirItemTR.appendChild(timeEarliestChildLastModifiedTD);

      // Create Latest Child Last Modified Date/Time element and add it to the row
      const timeLatestChildLastModifiedTD = document.createElement("td");
        timeLatestChildLastModifiedTD.classList.add("list-item-data");                  // directory-list-item > list-item-data
        timeLatestChildLastModifiedTD.classList.add("list-item-time");                  // directory-list-item > list-item-time
        timeLatestChildLastModifiedTD.classList.add("time-child-last-modified-latest"); // directory-list-item > time-child-last-modified-latest
        timeLatestChildLastModifiedTD.appendChild( document.createTextNode( formatMsToDateTime24HR(dirStats.time_childLastModified_latest) ) );
      dirItemTR.appendChild(timeLatestChildLastModifiedTD);



      // Create Smallest Size element and add it to the row
      const sizeSmallestTD = document.createElement("td");
        sizeSmallestTD.classList.add("list-item-data"); // directory-list-item > list-item-data
        sizeSmallestTD.classList.add("list-item-size"); // directory-list-item > list-item-size
        sizeSmallestTD.classList.add("size-smallest");  // directory-list-item > size-smallest
        sizeSmallestTD.appendChild( document.createTextNode( await messenger.messengerUtilities.formatFileSize(dirStats.size_smallest) ) );
      dirItemTR.appendChild(sizeSmallestTD);

      // Create Size element and add it to the row
      const sizeLargestTD = document.createElement("td");
        sizeLargestTD.classList.add("list-item-data"); // directory-list-item > list-item-data
        sizeLargestTD.classList.add("list-item-size"); // directory-list-item > list-item-size
        sizeLargestTD.classList.add("size-largest");   // directory-list-item > size-largest
        sizeLargestTD.appendChild( document.createTextNode( await messenger.messengerUtilities.formatFileSize(dirStats.size_largest) ) );
      dirItemTR.appendChild(sizeLargestTD);

      // Create Size element and add it to the row
      const sizeTotalTD = document.createElement("td");
        sizeTotalTD.classList.add("list-item-data"); // directory-list-item > list-item-data
        sizeTotalTD.classList.add("list-item-size"); // directory-list-item > list-item-size
        sizeTotalTD.classList.add("size-total");     // directory-list-item > size-total
        sizeTotalTD.appendChild( document.createTextNode( await messenger.messengerUtilities.formatFileSize(dirStats.size_total) ) );
      dirItemTR.appendChild(sizeTotalTD);

    return dirItemTR;
  }  



  // MABXXX THIS RETURNS ONLY THE 'stats' array!!!
  async getFsbStats() {
    let fsbStatsResponse;
    try {
      fsbStatsResponse = await this.#fsBrokerApi.fsbStats();
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
    } else {
      return fsbStatsResponse.stats; // MABXXX THIS RETURNS ONLY THE 'stats' array!!!
    }
  }



  updateUIOnSelectionChanged() {
    const deleteBtn     = document.getElementById("fsbStatsManagerDeleteButton");
    const selectedCount = this.getSelectedDomDirectoryListItemCount();

    if (! deleteBtn) {
      this.error("Failed to get element '#fsbStatsManagerDeleteButton'");
    } else {
      if (selectedCount == 0) {
        deleteBtn.disabled  = true;
      } else if (selectedCount == 1) {
        deleteBtn.disabled  = false;
      } else {
        deleteBtn.disabled  = false;
      }
    }
  }



  // and directory-list-item (TR or TD) was clicked
  async directoryListItemClicked(e) {
    if (! e) return;

////e.stopPropagation();
////e.stopImmediatePropagation();

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
          const dirName     = trElement.getAttribute("dirName");
          const wasSelected = trElement.classList.contains('selected');
      
          this.debug(`-- wasSelected=${wasSelected}  dirName="${dirName}"`);

          if (! wasSelected) {
            trElement.classList.add('selected');
          } else {
            trElement.classList.remove('selected');
          }

          this.updateUIOnSelectionChanged();
        }
      }
    }
  }

  deselectAllDirectories() {
    const domDirectoryList = document.getElementById("fsbStatsManagerDirectoryList");
    if (! domDirectoryList) {
      this.error("-- failed to get domDirectoryList");
    } else {
      for (const listItem of domDirectoryList.children) {
        listItem.classList.remove('selected');
      }

      this.updateUIOnSelectionChanged();
    }
  }



  // get only the FIRST!!!
  getSelectedDomDirectoryListItem() {
    const domDirectoryList = document.getElementById("fsbStatsManagerDirectoryList");
    if (! domDirectoryList) {
      this.error("-- failed to get domDirectoryList");
    } else {
      for (const domDirectoryListItemTR of domDirectoryList.children) {
        if (domDirectoryListItemTR.classList.contains('selected')) {
          return domDirectoryListItemTR;
        }
      }
    }
  }

  getSelectedDomDirectoryListItems() {
    const domDirectoryList = document.getElementById("fsbStatsManagerDirectoryList");
    if (! domDirectoryList) {
      this.error("-- failed to get domDirectoryList");
    } else {
      const selected = [];
      for (const domDirectoryListItemTR of domDirectoryList.children) {
        if (domDirectoryListItemTR.classList.contains('selected')) {
          selected.push(domDirectoryListItemTR);
        }
      }
      return selected;
    }
  }

  getSelectedDomDirectoryListItemCount() {
    let   count           = 0;
    const domDirectoryList = document.getElementById("fsbStatsManagerDirectoryList");

    if (! domDirectoryList) {
      this.error("-- failed to get domDirectoryList");
    } else {
      for (const domDirectoryListItemTR of domDirectoryList.children) {
        if (domDirectoryListItemTR.classList.contains('selected')) {
          ++count;
        }
      }
    }

    return count;
  }



  async refreshButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    const refreshBtn = document.getElementById("fsbStatsManagerRefreshButton");
    if (! refreshBtn) {
      this.error("Failed to get element '#fsbStatsManagerRefreshButton'");
    } else {
      refreshBtn.disabled = true;
    }

    await this.buildDirectoryListUI();

    this.updateUIOnSelectionChanged();

    if (refreshBtn) refreshBtn.disabled = false;
  }



  async deleteButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    this.resetMessages();
    this.resetErrors();

    const deleteBtn = document.getElementById("fsbStatsManagerDeleteButton");
    if (! deleteBtn) {
      this.error("Failed to get element '#fsbStatsManagerDeleteButton'");
    } else {
      deleteBtn.disabled = true;
    }

    const domSelectedDirectoryItemTRs = this.getSelectedDomDirectoryListItems();

    if (! domSelectedDirectoryItemTRs) {
      this.error("-- NO DIRECTORIES SELECTED -- Delete Button should have been disabled!!!");

    } else {
      this.debug(`-- domSelectedDirectoryItemTRs.length=${domSelectedDirectoryItemTRs.length}`);

      var errors  = 0;
      var deleted = 0;

      for (const domSelectedDirectoryItemTR of domSelectedDirectoryItemTRs) {
        const dirName = domSelectedDirectoryItemTR.getAttribute("dirName");
        this.debug(`-- Deleting Directory dirName="${dirName}"`);

        if (! dirName) {
          this.error("Failed to get Attribute 'dirName'");
        } else {
          const response = await this.#fsBrokerApi.fsbDeleteDirectory( dirName, {'recursive': true} );
          if (! response) {
            this.error(`-- FAILED TO DELETE DIRECTORY -- NO RESPONSE RETURNED -- dirName="${dirName}"`);
            ++errors;
          } else if (response.invalid) {
            this.error(`-- FAILED TO DELETE DIRECTORY -- INVALID RETURNED -- dirName="${dirName}": ${response.invalid}`); // MABXXX <---------- add response.invalid everywhere
            ++errors;
          } else if (response.error) {
            this.error(`-- FAILED TO DELETE DIRECTORY -- ERROR RETURNED -- dirName="${dirName}": ${response.error}`); // MABXXX <-------------- add response.error everywhere
            ++errors;
          } else if (! response.directoryName) {
            this.error(`-- FAILED TO DELETE DIRECTORY -- NO DIRECTORY NAME RETURNED -- dirName="${dirName}": response.directoryName="${response.directoryName}"`);
            ++errors;
          } else if (! response.deleted) {
            this.error(`-- FAILED TO DELETE DIRECTORY -- dirName="${dirName}" response.deleted="${response.deleted}"`);
            ++errors;
          } else {
            this.debug(`-- Directory Deleted -- dirName="${dirName}": response.directoryName="${response.directoryName}"`);
            ++deleted;
            domSelectedDirectoryItemTR.remove();
          }
        }
      }

      if (errors) {
        if (errors === 1) {
          this.setErrorFor("fsbStatsManagerTitlePanel", "fsbStatsManager_error_oneDirectoryDeleteFailed"); 
        } else {
          this.setErrorFor("fsbStatsManagerTitlePanel", "fsbStatsManager_error_nnDirectoriesDeleteFailed", errors); 
        }
      }
      if (deleted === 1) {
        this.setMessageFor("fsbStatsManagerTitlePanel", "fsbStatsManager_message_oneDirectoryDeleted"); 
      } else {
        this.setMessageFor("fsbStatsManagerTitlePanel", "fsbStatsManager_message_nnDirectoriesDeleted", deleted); 
      }
    }

    this.updateUIOnSelectionChanged();

//  if ( deleteBtn) {
//    deleteBtn.disabled = false; // MABXXX What if something is still selected???
//  }
  }



  resetMessages() {
    let msgPanelDivs = document.querySelectorAll("div.messages-panel");
    if (msgPanelDivs) {
      for (let msgPanelDiv of msgPanelDivs) {
        msgPanelDiv.setAttribute("msg", "false");
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
  setMessageFor(elementId, msgId, parms) {
    var i18nMessage;
    if (parms) {
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



  resetErrors() {
    let msgPanelDivs = document.querySelectorAll("div.messages-panel");
    if (msgPanelDivs) {
      for (let msgPanelDiv of msgPanelDivs) {
        msgPanelDiv.setAttribute("error", "false");
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
  setErrorFor(elementId, msgId, parms) {
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



  async doneButtonClicked(e) {
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
