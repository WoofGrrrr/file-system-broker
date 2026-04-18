//import { FsbOptions } from '../modules/options.js';
import * as utils     from './utilities.js';


export class QuotaManager {
  #CLASS_NAME = this.constructor.name;

  #INFO       = false;
  #LOG        = false;
  #DEBUG      = false;
  #WARN       = false;

  #LOG_SCHEDULED_QUOTA_CHECK_EVENTS = true;


  #logger;
  #fsbOptionsApi;
  #fsbCommandsApi;
  #fsbEventLogger;

  #quotaCheckEnabled             = true;       // boolean
  #quotaCheckUnit                = 'daily';    // string - 'daily', 'hourly', 'minutely'
  #quotaCheckDays                = 1;          // integer
  #quotaCheckDaysTimeOffset      = '00:00:00'; // string - HH:MM[:SS]
  #quotaCheckDaysTimeOffsetMS    = 0;          // integer
  #quotaCheckHours               = 4;          // integer
  #quotaCheckHoursMinuteOffset   = 0;          // integer
  #quotaCheckMinutes             = 15;         // integer
  #quotaCheckMinutesMinuteOffset = 0;          // integer

  #currentQuotaCheckParameters;

  #currentScheduledQuotaCheckDayMS;
  #currentScheduledQuotaCheckHourMS;
  #currentScheduledQuotaCheckMinuteMS;

  #scheduledQuotaCheckTimeout;
  #scheduledQuotaCheckEventDispatcher = new EventTarget();



  constructor(logger, fsbOptionsApi, fsbCommandsApi, fsbEventLogger) {
    this.#logger         = logger;
    this.#fsbOptionsApi  = fsbOptionsApi;
    this.#fsbCommandsApi = fsbCommandsApi;
    this.#fsbEventLogger = fsbEventLogger;

    this.#scheduledQuotaCheckEventDispatcher.addEventListener( 'ScheduledQuotaCheck', (e) => this.#onScheduledQuotaCheckEvent() );
  }



  info(...info) {
    if (! this.INFO) return;
    this.#logger.info(this.#CLASS_NAME, ...info);
  }

  infoAlways(...info) {
    this.#logger.infoAlways(this.#CLASS_NAME, ...info);
  }

  log(...info) {
    if (! this.#LOG) return;
    this.#logger.log(this.#CLASS_NAME, ...info);
  }

  logAlways(...info) {
    this.#logger.logAlways(this.#CLASS_NAME, ...info);
  }

  debug(...info) {
    if (! this.#DEBUG) return;
    this.#logger.debug(this.#CLASS_NAME, ...info);
  }

  debugAlways(...info) {
    this.#logger.debugAlways(this.#CLASS_NAME, ...info);
  }

  warn(...info) {
    if (! this.#WARN) return;
    this.#logger.warn(this.#CLASS_NAME, ...info);
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



  async processQuotas(parameters) {
    var response;

    var trialRun = parameters?.trialRun;
    if (parameters !== undefined) {
      if (parameters !== null && (typeof parameters) !== 'object') {
        const msg = `'parameters' parameter is not an Object - type='${typeof parameters}'`
        this.error(msg);
        await this.#fsbEventLogger.logInternalError("processQuotas", null, msg);
        return { 'invalid': msg };
      }

      if (trialRun !== undefined && (typeof parameters.trialRun) !== 'boolean') {
        const msg = `'parameters.trialRun' parameter is not boolean - type='${typeof parameters.trialRun}'`
        this.error(msg);
        await this.#fsbEventLogger.logInternalError("processQuotas", null, msg);
        return { 'invalid': msg };
      }
    }

    const storageQuotaEnabled   = await this.#fsbOptionsApi.isEnabledStorageQuota();
    const storageQuota          = await this.#fsbOptionsApi.getStorageQuota();
    var   storageQuotaUnit      = await this.#fsbOptionsApi.getStorageQuotaUnit();
    const fileSizeQuotaEnabled  = await this.#fsbOptionsApi.isEnabledFileSizeQuota();
    const fileSizeQuota         = await this.#fsbOptionsApi.getFileSizeQuota();
    var   fileSizeQuotaUnit     = await this.#fsbOptionsApi.getFileSizeQuotaUnit();
    const fileCountQuotaEnabled = await this.#fsbOptionsApi.isEnabledFileCountQuota();
    const fileCountQuota        = await this.#fsbOptionsApi.getFileCountQuota();
    var   fileCountQuotaUnit    = await this.#fsbOptionsApi.getFileCountQuotaUnit(); // not used

    storageQuotaUnit   = Object.hasOwn( utils.STORAGE_UNIT_MULTIPLIERS, storageQuotaUnit)  ? storageQuotaUnit  : 'MB';
    fileSizeQuotaUnit  = Object.hasOwn( utils.STORAGE_UNIT_MULTIPLIERS, fileSizeQuotaUnit) ? fileSizeQuotaUnit : 'KB';
////fileCountQuotaUnit = ???

    this.debug( `\n- trialRun ................ ${trialRun}`,
                `\n- storageQuotaEnabled ..... ${storageQuotaEnabled}`,
                `\n- storageQuota... ......... ${storageQuota}`,
                `\n- storageQuotaUnit ........ ${storageQuotaUnit}`,
                `\n- fileSizeQuotaEnabled .... ${fileSizeQuotaEnabled}`,
                `\n- fileSizeQuota ........... ${fileSizeQuota}`,
                `\n- fileSizeQuotaUnit ....... ${fileSizeQuotaUnit}`,
                `\n- fileCountQuotaEnabled ... ${fileCountQuotaEnabled}`,
                `\n- fileCountQuota .......... ${fileCountQuota}`,
                `\n- fileCountQuotaUnit ...... ${fileCountQuotaUnit}`, // not used
              );

    const cmdParameters = {
      'storageQuotaEnabled':   storageQuotaEnabled,
      'storageQuota':          storageQuota,
      'storageQuotaUnit':      storageQuotaUnit,
      'fileSizeQuotaEnabled':  fileSizeQuotaEnabled,
      'fileSizeQuota':         fileSizeQuota,
      'fileSizeQuotaUnit':     fileSizeQuotaUnit,
      'fileCountQuotaEnabled': fileCountQuotaEnabled,
      'fileCountQuota':        fileCountQuota,
//////'fileCountQuotaUnit':    fileCountQuotaUnit, // not used
    };
    if (trialRun) {
      cmdParameters['trialRun'] = true;
      this.debug("\n\nThis is a TRIAL RUN! Potential changes WILL be logged but NO actual CHANGES will be made!\n");
    }

    await this.#fsbEventLogger.logInternalEvent("processQuotas", "request", cmdParameters, "");

    const storageQuotaMultiplier   = utils.STORAGE_UNIT_MULTIPLIERS[storageQuotaUnit];  // STORAGE_UNIT_MULTIPLIERS uses BigInt!!!
    const fileSizeQuotaMultiplier  = utils.STORAGE_UNIT_MULTIPLIERS[fileSizeQuotaUnit]; // STORAGE_UNIT_MULTIPLIERS uses BigInt!!!
////const fileCountQuotaMultiplier = 1; // not used

    const storageQuotaBytes  = storageQuota  ? BigInt(storageQuota)  * storageQuotaMultiplier  : 0n;
    const fileSizeQuotaBytes = fileSizeQuota ? BigInt(fileSizeQuota) * fileSizeQuotaMultiplier : 0n;
    this.debug(`storageQuotaBytes=${storageQuotaBytes} fileSizeQuotaBytes=${fileSizeQuotaBytes}`);

    if (! storageQuotaEnabled && ! fileSizeQuotaEnabled && ! fileCountQuotaEnabled) {
      const msg = "No quotas are Enabled";
      this.debug(msg);
      await this.#fsbEventLogger.logInternalEvent("processQuotas", "success", cmdParameters, msg);
      response = {
        'status': 'success',
        'msg':    msg, // MABXXX <------------------------------------------------------------------------<<<<<
      };

    } else if (storageQuota < 1 && fileSizeQuota < 1 && fileCountQuota < 1) {
      const msg = "No quotas are Set";
      this.debug(msg);
      await this.#fsbEventLogger.logInternalEvent("processQuotas", "success", cmdParameters, msg);
      response = {
        'status': 'success',
        'msg':    msg, // MABXXX <------------------------------------------------------------------------<<<<<
      };

    } else {
      const fsbResponse = await this.#fsbCommandsApi.fsbStats( { 'includeDirStats': true } );

      if (! fsbResponse) {
        const msg = "No response from fsbStats Command";
        this.error(msg);
        await this.#fsbEventLogger.logInternalError("processQuotas", cmdParameters, msg);
        response = { 'error': msg };
      } else if (! fsbResponse.stats) {
        const msg = "Response from fsbStats Command has no 'stats' object";
        this.error(msg);
        await this.#fsbEventLogger.logInternalError("processQuotas", cmdParameters, msg);
        response = { 'error': msg };
      } else if (! fsbResponse.stats.dirStats) {
        const msg = "Response from fsbStats Command has no 'dirStats' object";
        this.error(msg);
        await this.#fsbEventLogger.logInternalError("processQuotas", cmdParameters, msg);
        response = { 'error': msg };
      } else {

        const dirStats        = fsbResponse.stats.dirStats;
        const dirStatsEntries = Object.entries(dirStats);
        this.debug(`dirStatsEntries.length=${dirStatsEntries.length}`);

        if (dirStatsEntries.length < 1) {
          const msg = "fsbStats Command returned no Directory Statistics";
          this.error(msg);
          await this.#fsbEventLogger.logInternalError("processQuotas", cmdParameters, msg);
          response = { 'error': msg };

        } else {
          const allExtensionsProps = await this.#fsbOptionsApi.getExtensionsProps();

          var   noExtCount              = 0;
          var   extCount                = 0;
          var   extSpecialCount         = 0;
          var   extNoQuotaCount         = 0;

          var   anyExtChanged           = false;
          var   extChangedCount         = 0;

          var   extPrevOverAnyQuota     = 0;
          var   extPrevOverStorageQuota = 0;
          var   extPrevOverFSQuota      = 0;
          var   extPrevOverFCQuota      = 0;

          var   extOverAnyQuota         = 0;
          var   extOverStorageQuota     = 0;
          var   extOverFSQuota          = 0;
          var   extOverFCQuota          = 0;

          var   extUnderAnyQuota        = 0;
          var   extUnderStorageQuota    = 0;
          var   extUnderFSQuota         = 0;
          var   extUnderFCQuota         = 0;

          for (const [dirName, stats] of dirStatsEntries) {
            if (stats.isFileSystemRoot) {
              this.debug(`Skipping FileSystem Root Directory "${dirName}"`);

            } else {
              const extProps = allExtensionsProps[dirName];

              if (! extProps) {
                this.debug(`There is no Configured Extension with an ID that is the same as Directory "${dirName}"`);
                ++noExtCount;

              } else {
                ++extCount;

                var   thisExtChanged               = false;
                var   extNewlyOverQuota            = false;
                var   extNewlyUnderQuota           = false;

                const extIsSpecial                 = extProps.special;
                const extIsNoQuota                 = extProps.noQuota;

                var   extCurrentlyOverStorageQuota = extProps.overStorageQuota;
                var   extCurrentlyOverFSQuota      = extProps.overFileSizeQuota;
                var   extCurrentlyOverFCQuota      = extProps.overFileCountQuota;

                if ( (typeof extCurrentlyOverStorageQuota) !== 'boolean' ) extCurrentlyOverStorageQuota = false;
                if ( (typeof extCurrentlyOverFSQuota     ) !== 'boolean' ) extCurrentlyOverFSQuota      = false;
                if ( (typeof extCurrentlyOverFCQuota     ) !== 'boolean' ) extCurrentlyOverFCQuota      = false;

                if (extCurrentlyOverStorageQuota || extCurrentlyOverFSQuota || extCurrentlyOverFCQuota) ++extPrevOverAnyQuota;

                if (extCurrentlyOverStorageQuota) ++extPrevOverStorageQuota;
                if (extCurrentlyOverFSQuota)      ++extPrevOverFSQuota;
                if (extCurrentlyOverFCQuota)      ++extPrevOverFCQuota;

                this.debug(`\n--- Checking quotas for Directory "${dirName}" for Extension "${extProps.id}"`,
                            `\n - extCurrentlyOverStorageQuota ..... ${extCurrentlyOverStorageQuota}`,
                            `\n - extCurrentlyOverFilsSizeQuota .... ${extCurrentlyOverFSQuota}`,
                            `\n - extCurrentlyOverFileCountQuota ... ${extCurrentlyOverFCQuota}`,
                            `\n - extPrevOverStorageQuota ... ${extPrevOverStorageQuota}`,
                            `\n - extPrevOverFSQuota ........ ${extPrevOverFSQuota}`,
                            `\n - extPrevOverFCQuota ........ ${extPrevOverFCQuota}`,
                          );

                if (extIsSpecial) {
                  this.debug(`Directory "${dirName}" is for 'SPECIAL' Extension "${extProps.id}"`);
                  ++extSpecialCount;
                }

                if (extIsNoQuota) {
                  this.debug(`Directory "${dirName}" is for 'NO QUOTA' Extension "${extProps.id}"`);
                  ++extNoQuotaCount;
                }

                this.debug(`\nstats.size_total=${stats.size_total} stats.size_largest=${stats.size_largest} stats.count_children=${stats.count_children}`);

                if (storageQuotaEnabled && storageQuotaBytes > 0n && ! extIsSpecial && ! extIsNoQuota) {
                  this.debug(`Checking Directory "${dirName}" for extension "${extProps.id}" Storage Quota ${stats.size_total} > ${storageQuotaBytes} ???`);

                  if (stats.size_total && stats.size_total > storageQuotaBytes ) {
                    if ( ! extCurrentlyOverStorageQuota) {
                      this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NOW OVER the Storage Quota ${stats.size_total} > ${storageQuotaBytes}`);
                      if (! trialRun) {
                        extProps['overStorageQuota'] = true;
                        thisExtChanged               = true;
                      }
                      extNewlyOverQuota = true;
                      ++extOverStorageQuota;
                    }
                  } else {
                    if (extCurrentlyOverStorageQuota) {
                      this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NO LONGER OVER the Storage Quota ${stats.size_total} <= ${storageQuotaBytes}`);
                      if (! trialRun) {
                        extProps['overStorageQuota'] = false;
                        thisExtChanged               = true;
                      }
                      extNewlyUnderQuota = true;
                      ++extUnderStorageQuota;
                    }
                  }
                } else {
                  if (extCurrentlyOverStorageQuota) {
                    var reason;
                    if      (extIsSpecial)             reason = "the Extension is SPECIAL";
                    else if (extIsNoQuota)             reason = "the Extension has Quotas Disabled";
                    else if (! storageQuotaEnabled)    reason = "the Quota is DISABLED";
                    else /* storageQuotaBytes <= 0  */ reason = "the Quota is NOT Configured";
                    this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NO LONGER OVER the Storage Quota because ${reason}`);

                    if (! trialRun) {
                      extProps['overStorageQuota'] = false;
                      thisExtChanged               = true;
                    }
                    extNewlyUnderQuota = true;
                    ++extUnderStorageQuota;
                  }
                }

                if (fileSizeQuotaEnabled && fileSizeQuotaBytes > 0n && ! extIsSpecial && ! extIsNoQuota) {
                  this.debug(`Checking Directory "${dirName}" for extension "${extProps.id}" File Size Quota ${stats.size_largest} > ${fileSizeQuotaBytes} ???`);

                  if (stats.size_largest && stats.size_largest > fileSizeQuotaBytes) {
                    if (! extCurrentlyOverFSQuota) {
                      this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NOW OVER the File Size Quota ${stats.size_largest} > ${fileSizeQuotaBytes}`);
                      if (! trialRun) {
                        extProps['overFileSizeQuota'] = true;
                        thisExtChanged                = true;
                      }
                      extNewlyOverQuota = true;
                      ++extOverFSQuota;
                    }
                  } else {
                    if (extCurrentlyOverFSQuota) {
                      this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NO LONGER OVER the File Size Quota ${stats.size_largest} <= ${fileSizeQuotaBytes}`);
                      if (! trialRun) {
                        extProps['overFileSizeQuota'] = false;
                        thisExtChanged                = true;
                      }
                      extNewlyUnderQuota = true;
                      ++extUnderFSQuota;
                    }
                  }
                } else {
                  if (extCurrentlyOverFSQuota) {
                    var reason;
                    if      (extIsSpecial)              reason = "the Extension is SPECIAL";
                    else if (extIsNoQuota)              reason = "the Extension has Quotas Disabled";
                    else if (! fileSizeQuotaEnabled)    reason = "the Quota is DISABLED";
                    else /* fileSizeQuotaBytes <= 0 */  reason = "the Quota is NOT Configured";
                    this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NO LONGER OVER the File Size Quota because ${reason}`);

                    if (! trialRun) {
                      extProps['overFileSizeQuota'] = false;
                      thisExtChanged                = true;
                    }
                    extNewlyUnderQuota = true;
                    ++extUnderFSQuota;
                  }
                }

                // MABXXX MABXXX MABXXX SHOULD THIS BE USING count_regular INSTEAD ???????????? MABXXX MABXXX MABXXX
                if (fileCountQuotaEnabled && fileCountQuota > 0 && ! extIsSpecial && ! extIsNoQuota) {
                  this.debug(`Checking Directory "${dirName}" for extension "${extProps.id}" File Count Quota ${stats.count_children} > ${fileCountQuota}???`);

                  if (stats.count_children && stats.count_children > fileCountQuota) {
                    this.debug(`Directory "${dirName}" for extension "${extProps.id}" File Count Quota ${stats.count_children} > ${fileCountQuota}`);
                    if ( ! extCurrentlyOverFCQuota) {
                      this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NOW OVER the File Count Quota ${stats.count_children} > ${fileCountQuota}`);
                      if (! trialRun) {
                        extProps['overFileCountQuota'] = true;
                        thisExtChanged                 = true;
                      }
                      extNewlyOverQuota = true;
                      ++extOverFCQuota;
                    }
                  } else {
                    this.debug(`Directory "${dirName}" for extension "${extProps.id}" File Count Quota ${stats.count_children} <= ${fileCountQuota}`);
                    if (extCurrentlyOverFCQuota) {
                      this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NO LONGER OVER the File Count Quota ${stats.count_children} <= ${fileCountQuota}`);
                      if (! trialRun) {
                        extProps['overFileCountQuota'] = false;
                        thisExtChanged                 = true;
                      }
                      extNewlyUnderQuota = true;
                      ++extUnderFCQuota;
                    }
                  }
                } else {
                  if (extCurrentlyOverFCQuota) {
                    var reason;
                    if      (extIsSpecial)            reason = "the Extension is SPECIAL";
                    else if (extIsNoQuota)            reason = "the Extension has Quotas Disabled";
                    else if (! fileCountQuotaEnabled) reason = "the Quota is Disabled";
                    else /* fileCountQuota <= 0 */    reason = "the Quota is NOT Configured";
                    this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NO LONGER OVER the File Count Quota because ${reason}`);

                    if (! trialRun) {
                      extProps['overFileCountQuota'] = false;
                      thisExtChanged                 = true;
                    }
                    extNewlyUnderQuota = true;
                    ++extUnderFCQuota;
                  }
                }

                if (! trialRun && thisExtChanged) {
                  anyExtChanged = true;
                  ++extChangedCount;
                }

                if (extNewlyOverQuota) ++extOverAnyQuota;

                if (extNewlyUnderQuota) ++extUnderAnyQuota;
              }
            }
          }

          if (trialRun) {
            this.debug("This is a TRIAL RUN! NOT Storing changes!");
          } else if (! anyExtChanged) {
            this.debug("No Extension Props were changed, NOT Storing allExtensionsProps");
          } else {
            this.debug("Storing allExtensionsProps");
            await this.#fsbOptionsApi.storeExtensionsProps(allExtensionsProps);
          }

          const result =    `noExtCount=${noExtCount}`
                         + ` extCount=${extCount}`
                         + ` special=${extSpecialCount}`
                         + ` noQuota=${extNoQuotaCount}`
                         + ` changed=${extChangedCount}`
                         + ` overS=${extOverStorageQuota}`
                         + ` overFS=${extOverFSQuota}`
                         + ` overFC=${extOverFCQuota}`
                         + ` underS=${extUnderStorageQuota}`
                         + ` underFS=${extUnderFSQuota}`
                         + ` underFC=${extUnderFCQuota}`;

          await this.#fsbEventLogger.logInternalEvent("processQuotas", "success", cmdParameters, result);

          response = {
            'trialRun':      trialRun,
            'status':        'success',

            'result': {
              'noExtCount':  noExtCount,
              'extCount':    extCount,
              'special':     extSpecialCount,
              'noQuota':     extNoQuotaCount,

              'anyChanged':  anyExtChanged, // or changed > 0
              'changed':     extChangedCount,

              'prevOverAny': extPrevOverAnyQuota,
              'prevOverS':   extPrevOverStorageQuota,
              'prevOverFS':  extPrevOverFSQuota,
              'prevOverFC':  extPrevOverFCQuota,

              'overAny':     extOverAnyQuota,
              'overS':       extOverStorageQuota,
              'overFS':      extOverFSQuota,
              'overFC':      extOverFCQuota,

              'underAny':    extUnderAnyQuota,
              'underS':      extUnderStorageQuota,
              'underFS':     extUnderFSQuota,
              'underFC':     extUnderFCQuota,
            }
          };
        }
      }
    }

    this.debug("\n\n===== RESPONSE:\n", response, "\n=====\n\n");

    return response;
  }



  async processExtQuotas(extensionId, parameters) {
    var response;

    if (! extensionId) {
      const msg = "Missing 'extensionId' parameter";
      this.error(msg);
      await this.#fsbEventLogger.logInternalError("processExtQuotas", null, msg);
      return { 'invalid': msg };
    } else if (! utils.isValidExtensionId(extensionId)) {
      const msg = `Invalid 'extensionId' parameter: "${extensionId}"`;
      this.error(msg);
      await this.#fsbEventLogger.logInternalError("processExtQuotas", null, msg);
      return { 'invalid': msg };
    }

    var trialRun = parameters?.trialRun;
    if (parameters !== undefined) {
      if (parameters !== null && (typeof parameters) !== 'object') {
        const msg = `'parameters' parameter is not an Object - type='${typeof parameters}'`
        this.error(msg);
        await this.#fsbEventLogger.logInternalError("processExtQuotas", null, msg);
        return { 'invalid': msg };
      }

      if (trialRun !== undefined && (typeof parameters.trialRun) !== 'boolean') {
        const msg = `'parameters.trialRun' parameter is not boolean - type='${typeof parameters.trialRun}'`
        this.error(msg);
        await this.#fsbEventLogger.logInternalError("processExtQuotas", null, msg);
        return { 'invalid': msg };
      }
    }

    const storageQuotaEnabled   = await this.#fsbOptionsApi.isEnabledStorageQuota();
    const storageQuota          = await this.#fsbOptionsApi.getStorageQuota();
    var   storageQuotaUnit      = await this.#fsbOptionsApi.getStorageQuotaUnit();
    const fileSizeQuotaEnabled  = await this.#fsbOptionsApi.isEnabledFileSizeQuota();
    const fileSizeQuota         = await this.#fsbOptionsApi.getFileSizeQuota();
    var   fileSizeQuotaUnit     = await this.#fsbOptionsApi.getFileSizeQuotaUnit();
    const fileCountQuotaEnabled = await this.#fsbOptionsApi.isEnabledFileCountQuota();
    const fileCountQuota        = await this.#fsbOptionsApi.getFileCountQuota();
    var   fileCountQuotaUnit    = await this.#fsbOptionsApi.getFileCountQuotaUnit(); // not used

    storageQuotaUnit   = Object.hasOwn( utils.STORAGE_UNIT_MULTIPLIERS, storageQuotaUnit)  ? storageQuotaUnit  : 'MB';
    fileSizeQuotaUnit  = Object.hasOwn( utils.STORAGE_UNIT_MULTIPLIERS, fileSizeQuotaUnit) ? fileSizeQuotaUnit : 'KB';
////fileCountQuotaUnit = ???

    this.debug( `\n- extensionId ............. ${extensionId}`,
                `\n- trialRun ................ ${trialRun}`,
                `\n- storageQuotaEnabled ..... ${storageQuotaEnabled}`,
                `\n- storageQuota ............ ${storageQuota}`,
                `\n- storageQuotaUnit ........ ${storageQuotaUnit}`,
                `\n- fileSizeQuotaEnabled .... ${fileSizeQuotaEnabled}`,
                `\n- fileSizeQuota ........... ${fileSizeQuota}`,
                `\n- fileSizeQuotaUnit ....... ${fileSizeQuotaUnit}`,
                `\n- fileCountQuotaEnabled ... ${fileCountQuotaEnabled}`,
                `\n- fileCountQuota .......... ${fileCountQuota}`,
                `\n- fileCountQuotaUnit ...... ${fileCountQuotaUnit}`, // not used
              );

    const cmdParameters = {
      'extensionId':           extensionId,
      'storageQuota':          storageQuota,
      'storageQuotaEnabled':   storageQuotaEnabled,
      'storageQuotaUnit':      storageQuotaUnit,
      'fileSizeQuotaEnabled':  fileSizeQuotaEnabled,
      'fileSizeQuota':         fileSizeQuota,
      'fileSizeQuotaUnit':     fileSizeQuotaUnit,
      'fileCountQuotaEnabled': fileCountQuotaEnabled,
      'fileCountQuota':        fileCountQuota,
//////'fileCountQuotaUnit':    fileCountQuotaUnit, // not used
    };
    if (trialRun) {
      cmdParameters['trialRun'] = true;
      this.debug("\n\nThis is a TRIAL RUN! Potential changes WILL be logged but NO actual CHANGES will be made!\n");
    }

    await this.#fsbEventLogger.logInternalEvent("processExtQuotas", "request", cmdParameters, "");

    const storageQuotaMultiplier   = utils.STORAGE_UNIT_MULTIPLIERS[storageQuotaUnit];  // STORAGE_UNIT_MULTIPLIERS uses BigInt!!!
    const fileSizeQuotaMultiplier  = utils.STORAGE_UNIT_MULTIPLIERS[fileSizeQuotaUnit]; // STORAGE_UNIT_MULTIPLIERS uses BigInt!!!
////const fileCountQuotaMultiplier = 1; // not used

    const storageQuotaBytes  = storageQuota  ? BigInt(storageQuota)  * storageQuotaMultiplier  : 0n;
    const fileSizeQuotaBytes = fileSizeQuota ? BigInt(fileSizeQuota) * fileSizeQuotaMultiplier : 0n;
    this.debug(`storageQuotaBytes=${storageQuotaBytes} fileSizeQuotaBytes=${fileSizeQuotaBytes}`);

    if (! storageQuotaEnabled && ! fileSizeQuotaEnabled && ! fileCountQuotaEnabled) {
      const msg = "No quotas are Enabled";
      this.debug(msg);
      await this.#fsbEventLogger.logInternalEvent("processExtQuotas", "success", cmdParameters, msg);
      response = {
        'status': 'success',
        'msg':    msg, // MABXXX <------------------------------------------------------------------------<<<<<
      };

    } else if (storageQuota < 1 && fileSizeQuota < 1 && fileCountQuota < 1) {
      const msg = "No quotas are Configured";
      this.debug(msg);
      await this.#fsbEventLogger.logInternalEvent("processExtQuotas", "success", cmdParameters, msg);
      response = {
        'status': 'success',
        'msg':    msg, // MABXXX <------------------------------------------------------------------------<<<<<
      };

    } else {
      const fsbResponse = await this.#fsbCommandsApi.extensionStats(extensionId);

      if (! fsbResponse) {
        const msg = "No response from stats Command";
        this.error(msg);
        await this.#fsbEventLogger.logInternalError("processExtQuotas", cmdParameters, msg);
        response = { 'error': msg };

      } else if (Object.haOwn(fsbResponse, 'exists') &&  ! fsbResponse.exists) {
        const msg = `Directory for Extension "${extensionId}" does not exist`;
        this.error(msg);
        await this.#fsbEventLogger.logInternalError("processExtQuotas", cmdParameters, msg);
        response = { 'error': msg };

      } else if (! Object.hasOwn(fsbResponse, 'stats')) {
        const msg = "Response from stats Command has no 'key' object";
        this.error(msg);
        await this.#fsbEventLogger.logInternalError("processExtQuotas", cmdParameters, msg);

        response = { 'error': msg };
      } else if (! fsbResponse.stats[extensionId]) {
        const msg = `Response from stats Command has no 'dirStats' object for Extension "${extensionId}"`;
        this.error(msg);
        await this.#fsbEventLogger.logInternalError("processExtQuotas", cmdParameters, msg);
        response = { 'error': msg };

      } else {
        const stats   = fsbResponse.stats[extensionId];
        const dirName = stats.dirName;

        if (stats.isFileSystemRoot) {
          const msg = `FileSystem Root Directory "${dirName}"`;
          this.error(msg);
          await this.#fsbEventLogger.logInternalError("processExtQuotas", cmdParameters, msg);
          response = { 'error': msg };

        } else {

          const extProps = await this.#fsbOptionsApi.getExtensionPropsById(extensionId);

          if (! extProps) {
            const msg = `Failed to get Extension Props for Extension "${extensionId}"`;
            this.error(msg);
            await this.#fsbEventLogger.logInternalError("processExtQuotas", cmdParameters, msg);
            response = { 'error': msg };

          } else {
            const extIsSpecial            = extProps.special;
            const extIsNoQuota            = extProps.noQuota;
            var   extChanged              = false;

            var   extPrevOverAnyQuota     = false;
            var   extPrevOverStorageQuota = false;
            var   extPrevOverFSQuota      = false;
            var   extPrevOverFCQuota      = false;

            var   extOverAnyQuota         = false;
            var   extOverStorageQuota     = false;
            var   extOverFSQuota          = false;
            var   extOverFCQuota          = false;

            var   extUnderAnyQuota        = false;
            var   extUnderStorageQuota    = false;
            var   extUnderFSQuota         = false;
            var   extUnderFCQuota         = false;

            extPrevOverStorageQuota = extProps.overStorageQuota;
            extPrevOverFSQuota      = extProps.overFileSizeQuota;
            extPrevOverFCQuota      = extProps.overFileCountQuota;

            if ( (typeof extPrevOverStorageQuota) !== 'boolean' ) extPrevOverStorageQuota = false;
            if ( (typeof extPrevOverFSQuota     ) !== 'boolean' ) extPrevOverFSQuota      = false;
            if ( (typeof extPrevOverFCQuota     ) !== 'boolean' ) extPrevOverFCQuota      = false;

            this.debug( `\n--- Checking quotas for Directory "${dirName}" for Extension "${extProps.id}"`,
                        `\n - extPrevOverStorageQuota ..... ${extPrevOverStorageQuota}`,
                        `\n - extPrevOverFilsSizeQuota .... ${extPrevOverFSQuota}`,
                        `\n - extPrevOverFileCountQuota ... ${extPrevOverFCQuota}`,
                      );

            if (extIsSpecial) {
              this.debug(`Directory "${dirName}" is for 'SPECIAL' Extension "${extProps.id}"`);
            }

            if (extIsNoQuota) {
              this.debug(`Directory "${dirName}" is for 'NO QUOTA' Extension "${extProps.id}"`);
            }

            this.debug(`\nstats.size_total=${stats.size_total} stats.size_largest=${stats.size_largest} stats.count_children=${stats.count_children}`);

            if (storageQuotaEnabled && storageQuotaBytes > 0n && ! extIsSpecial && ! extIsNoQuota) {
              this.debug(`Checking Directory "${dirName}" for extension "${extProps.id}" Storage Quota ${stats.size_total} > ${storageQuotaBytes} ???`);

              if (stats.size_total && stats.size_total > storageQuotaBytes ) {
                if ( ! extCurrentlyOverStorageQuota) {
                  this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NOW OVER the Storage Quota ${stats.size_total} > ${storageQuotaBytes}`);
                  if (! trialRun) {
                    extProps['overStorageQuota'] = true;
                    extChanged                   = true;
                  }
                  extOverAnyQuota = true;
                  extOverStorageQuota = true;
                }
              } else {
                if (extCurrentlyOverStorageQuota) {
                  this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NO LONGER OVER the Storage Quota ${stats.size_total} <= ${storageQuotaBytes}`);
                  if (! trialRun) {
                    extProps['overStorageQuota'] = false;
                    extChanged                   = true;
                  }
                  extUnderAnyQuota     = true;
                  extUnderStorageQuota = true;
                }
              }
            } else {
              if (extCurrentlyOverStorageQuota) {
                var reason;
                if      (extIsSpecial)            reason = "the Extension is SPECIAL";
                else if (extIsNoQuota)            reason = "the Extension has Quotas Disabled";
                else if (! storageQuotaEnabled)   reason = "the Quota is DISABLED";
                else /* storageQuotaBytes <= 0 */ reason = "the Quota is NOT Configured";
                this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NO LONGER OVER the Storage Quota because ${reason}`);

                if (! trialRun) {
                  extProps['overStorageQuota'] = false;
                  extChanged                   = true;
                }
                extUnderAnyQuota     = true;
                extUnderStorageQuota = true;
              }
            }

            if (fileSizeQuotaEnabled && fileSizeQuotaBytes > 0n && ! extIsSpecial && ! extIsNoQuota) {
              this.debug(`Checking Directory "${dirName}" for extension "${extProps.id}" File Size Quota ${stats.size_largest} > ${fileSizeQuotaBytes} ???`);

              if (stats.size_largest && stats.size_largest > fileSizeQuotaBytes) {
                if (! extCurrentlyOverFSQuota) {
                  this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NOW OVER the File Size Quota ${stats.size_largest} > ${fileSizeQuotaBytes}`);
                  if (! trialRun) {
                    extProps['overFileSizeQuota'] = true;
                    extChanged                    = true;
                  }
                  extOverAnyQuota = true;
                  extOverFSQuota  = true;
                }
              } else {
                if (extCurrentlyOverFSQuota) {
                  this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NO LONGER OVER the File Size Quota ${stats.size_largest} <= ${fileSizeQuotaBytes}`);
                  if (! trialRun) {
                    extProps['overFileSizeQuota'] = false;
                    extChanged                    = true;
                  }
                  extUnderAnyQuota = true;
                  extUnderFSQuota  = true;
                }
              }
            } else {
              if (extCurrentlyOverFSQuota) {
                var reason;
                if      (extIsSpecial)             reason = "the Extension is SPECIAL";
                else if (extIsNoQuota)             reason = "the Extension has Quotas Disabled";
                else if (! fileSizeQuotaEnabled)   reason = "the Quota is DISABLED";
                else /* fileSizeQuotaBytes <= 0 */ reason = "the Quota is NOT Configured";
                this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NO LONGER OVER the File Size Quota because ${reason}`);

                if (! trialRun) {
                  extProps['overFileSizeQuota'] = false;
                  extChanged                    = true;
                }
                extUnderAnyQuota = true;
                extUnderFSQuota  = true;
              }
            }

            // MABXXX MABXXX MABXXX SHOULD THIS BE USING count_regular INSTEAD ???????????? MABXXX MABXXX MABXXX
            if (fileCountQuotaEnabled && fileCountQuota > 0 && ! extIsSpecial && ! extIsNoQuota) {
              this.debug(`Checking Directory "${dirName}" for extension "${extProps.id}" File Count Quota ${stats.count_children} > ${fileCountQuota}???`);

              if (stats.count_children && stats.count_children > fileCountQuota) {
                this.debug(`Directory "${dirName}" for extension "${extProps.id}" File Count Quota ${stats.count_children} > ${fileCountQuota}`);
                if ( ! extCurrentlyOverFCQuota) {
                  this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NOW OVER the File Count Quota ${stats.count_children} > ${fileCountQuota}`);
                  if (! trialRun) {
                    extProps['overFileCountQuota'] = true;
                    extChanged                     = true;
                  }
                  extOverAnyQuota = true;
                  extOverFCQuota  = true;
                }
              } else {
                this.debug(`Directory "${dirName}" for extension "${extProps.id}" File Count Quota ${stats.count_children} <= ${fileCountQuota}`);
                if (extCurrentlyOverFCQuota) {
                  this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NO LONGER OVER the File Count Quota ${stats.count_children} <= ${fileCountQuota}`);
                  if (! trialRun) {
                    extProps['overFileCountQuota'] = false;
                    extChanged                     = true;
                  }
                  extUnderAnyQuota = true;
                  extUnderFCQuota  = true;
                }
              }
            } else {
              if (extCurrentlyOverFCQuota) {
                var reason;
                if      (extIsSpecial)            reason = "the Extension is SPECIAL";
                else if (extIsNoQuota)            reason = "the Extension has Quotas Disabled";
                else if (! fileCountQuotaEnabled) reason = "the Quota is DISABLED";
                else /* fileCountQuota <= 0 */    reason = "the Quota is NOT Configured";
                this.debug(`Directory "${dirName}" for extension "${extProps.id}" is NO LONGER OVER the File Count Quota because ${reason}`);

                if (! trialRun) {
                  extProps['overFileCountQuota'] = false;
                  extChanged                     = true;
                }
                extUnderAnyQuota = true;
                extUnderFCQuota  = true;
              }
            }
          }
        }
      }

      if (trialRun) {
        this.debug("This is a TRIAL RUN! NOT Storing changes!");
      } else if (! extChanged) {
        this.debug("The Extension Props were NOT changed, NOT Storing extProps");
      } else {
        this.debug("Storing extProps");
        await this.#fsbOptionsApi.storeExtensionPropsById(extensionId, extProps);
      }

      const result =   ` special=${extSpecial}`
                     + ` noQuota=${extNoQuota}`
                     + ` changed=${extChanged}`
                     + ` overS=${extOverStorageQuota}`
                     + ` overFS=${extOverFSQuota}`
                     + ` overFC=${extOverFCQuota}`
                     + ` underS=${extUnderStorageQuota}`
                     + ` underFS=${extUnderFSQuota}`
                     + ` underFC=${extUnderFCQuota}`;

      await this.#fsbEventLogger.logInternalEvent("processExtQuotas", "success", cmdParameters, result);

      response = {
        'trialRun':    trialRun,
        'status':      'success',

        'result': {
          'special':     extSpecial,
          'noQuota':     extNoQuota,

          'changed':     extChanged,

          'prevOverAny': extPrevOverAnyQuota,
          'prevOverS':   extPrevOverStorageQuota,
          'prevOverFS':  extPrevOverFSQuota,
          'prevOverFC':  extPrevOverFCQuota,

          'overAny':     extOverAnyQuota,
          'overS':       extOverStorageQuota,
          'overS':       extOverFSQuota,
          'overFC':      extOverFCQuota,

          'underAny':    extUnderAnyQuota,
          'underS':      extUnderStorageQuota,
          'underFS':     extUnderFSQuota,
          'underFC':     extUnderFCQuota,
        }
      };
    }

    this.debug("\n\n===== RESPONSE:\n", response, "\n=====\n\n");

    return response;
  }



  async resetExtQuotas(extensionId) {
    const cmdParameters = { 'extensionId': extensionId };
    await this.#fsbEventLogger.logInternalEvent("resetExtQuotas", "request", cmdParameters, "");

    var response;

    if (! extensionId) {
      const msg = "Missing extensionId parameter";
      this.error(msg);
      await this.#fsbEventLogger.logInternalError("resetExtQuotas", cmdParameters, msg);
      response = { 'invalid': msg };

    } else if ((typeof extensionId) !== 'string') {
      const msg = `Invalid extensionId parameter type: '${typeof extensionId}'`;
      this.error(msg);
      await this.#fsbEventLogger.logInternalError("resetExtQuotas", cmdParameters, msg);
      response = { 'invalid': msg };

    } else {
      const extProps = await this.#fsbOptionsApi.getExtensionPropsById(extensionId);

      if (! extProps) {
        const msg = `Failed to get ExtensionProps for Extension "${extensionId}"`;
        this.error(msg);
        await this.#fsbEventLogger.logInternalError("resetExtQuotas", cmdParameters, msg);
        response = { 'error': msg };

      } else {
        const special = (typeof extProps.special) === 'boolean' ? extProps.special : false;
        const noQuota = (typeof extProps.noQuota) === 'boolean' ? extProps.noQuota : false;

        var overStorageQuota = extProps.overStorageQuota;
        var overFSQuota      = extProps.overFileSizeQuota;
        var overFCQuota      = extProps.overFileCountQuota;

        if ( (typeof overStorageQuota) !== 'boolean' ) overStorageQuota = false;
        if ( (typeof overFSQuota     ) !== 'boolean' ) overFSQuota      = false;
        if ( (typeof overFCQuota     ) !== 'boolean' ) overFCQuota      = false;

        const overAnyQuota = (overStorageQuota || overFSQuota || overFCQuota);

        if (overStorageQuota) {
          extProps.overStorageQuota = false;
        }

        if (overFSQuota) {
          extProps.overFileSizeQuota = false;
        }

        if (overFCQuota) {
          extProps.overFileCountQuota = false;
        }

        if (overAnyQuota) {
          await this.#fsbOptionsApi.storeExtensionPropsById(extensionId, extProps);
        }

        const result =    `special=${special}`
                       + ` noQuota=${noQuota}`
                       + ` overAny=${overAnyQuota}`
                       + ` overS=${overStorageQuota}`
                       + ` overFS=${overFSQuota}`
                       + ` overFC=${overFCQuota}`;

        await this.#fsbEventLogger.logInternalEvent("resetExtQuotas", "success", cmdParameters, result);

        response = {
          'status':    'success',

          'result': {
            'special': special,
            'noQuota': noQuota,
            'overAny': overAnyQuota,
            'overS':   overStorageQuota,
            'overFS':  overFSQuota,
            'overFC':  overFCQuota,
          }
        };
      }
    }

    return response;
  }



  async resetAllExtQuotas() {
    await this.#fsbEventLogger.logInternalEvent("resetAllExtQuotas", "request", "", "");

    const allExtensionsProps        = await this.#fsbOptionsApi.getExtensionsProps();
    const allExtensionsPropsEntries = Object.entries(allExtensionsProps);

    var extSpecialCount       = 0;
    var extNoQuotaCount       = 0;
    var overAnyQuotaCount     = 0;
    var overStorageQuotaCount = 0;
    var overFSQuotaCount      = 0;
    var overFCQuotaCount      = 0;

    var response;

    for (const [extId, extProps] of allExtensionsPropsEntries) {
      if (extProps.special) ++extSpecialCount;
      if (extProps.noQuota) ++extNoQuotaCount;

      var extOverStorageQuota = extProps.overStorageQuota;
      var extOverFSQuota      = extProps.overFileSizeQuota;
      var extOverFCQuota      = extProps.overFileCountQuota;

      if ( (typeof extOverStorageQuota) !== 'boolean' ) extOverStorageQuota = false;
      if ( (typeof extOverFSQuota     ) !== 'boolean' ) extOverFSQuota      = false;
      if ( (typeof extOverFCQuota     ) !== 'boolean' ) extOverFCQuota      = false;

      if (extOverStorageQuota || extOverFSQuota || extOverFCQuota) ++overAnyQuotaCount;

      if (extOverStorageQuota) {
        extProps.overStorageQuota = false;
        ++overStorageQuotaCount;
      }

      if (extOverFSQuota) {
        extProps.overFileSizeQuota = false;
        ++overFSQuotaCount;
      }

      if (extOverFCQuota) {
        extProps.overFileCountQuota = false;
        ++overFCQuotaCount;
      }

    }

    if (overAnyQuotaCount) {
      await this.#fsbOptionsApi.storeExtensionsProps(allExtensionsProps);
    }

    const result =    `special=${extSpecialCount}`
                   + ` noQuota=${extNoQuotaCount}`
                   + ` overAny=${overAnyQuotaCount}`
                   + ` overS=${overStorageQuotaCount}`
                   + ` overFS=${overFSQuotaCount}`
                   + ` overFC=${overFCQuotaCount}`;

    await this.#fsbEventLogger.logInternalEvent("resetAllExtQuotas", "success", "", result);

    response = {
      'status':    'success',

      'result': {
        'special': extSpecialCount,
        'noQuota': extNoQuotaCount,
        'overAny': overAnyQuotaCount,
        'overS':   overStorageQuotaCount,
        'overFS':  overFSQuotaCount,
        'overFC':  overFCQuotaCount,
      }
    };

    this.debug("\n\n===== RESPONSE:\n", response, "\n=====\n\n");

    return response;
  }



  async #initQuotaCheckParameters() {
    this.#quotaCheckEnabled             = await this.#fsbOptionsApi.isEnabledQuotaCheck();              // boolean
    this.#quotaCheckUnit                = await this.#fsbOptionsApi.getQuotaCheckUnit();                // string - 'daily', 'hourly', 'minutely'
    this.#quotaCheckDays                = await this.#fsbOptionsApi.getQuotaCheckDays();                // integer
    this.#quotaCheckDaysTimeOffset      = await this.#fsbOptionsApi.getQuotaCheckDaysTimeOffset();      // string - HH:MM[:SS]
    this.#quotaCheckDaysTimeOffsetMS    = await this.#fsbOptionsApi.getQuotaCheckDaysTimeOffsetMS();    // integer
    this.#quotaCheckHours               = await this.#fsbOptionsApi.getQuotaCheckHours();               // integer
    this.#quotaCheckHoursMinuteOffset   = await this.#fsbOptionsApi.getQuotaCheckHoursMinuteOffset();   // integer
    this.#quotaCheckMinutes             = await this.#fsbOptionsApi.getQuotaCheckMinutes();             // integer
    this.#quotaCheckMinutesMinuteOffset = await this.#fsbOptionsApi.getQuotaCheckMinutesMinuteOffset(); // integer

    this.#createQuotaCheckParameters();
  }

  #createQuotaCheckParameters() {
    const parameters = {
      'enabled':             this.#quotaCheckEnabled,             // boolean
      'unit':                this.#quotaCheckUnit,                // string - 'daily', 'hourly, 'minutely'
      'days':                this.#quotaCheckDays,                // integer
      'daysTimeOffset':      this.#quotaCheckDaysTimeOffset,      // string - HH:MM[:SS]
      'daysTimeOffsetMS':    this.#quotaCheckDaysTimeOffsetMS,    // integer
      'hours':               this.#quotaCheckHours,               // integer
      'hoursMinuteOffset':   this.#quotaCheckHoursMinuteOffset,   // integer
      'minutes':             this.#quotaCheckMinutes,             // integer
      'minutesMinuteOffset': this.#quotaCheckMinutesMinuteOffset, // integer
    };

    Object.freeze(parameters);

    this.#currentQuotaCheckParameters = parameters;
  }

  // The returned Object is FROZEN!!!
  getCurrentQuotaCheckParameters() {
    return this.#currentQuotaCheckParameters;
  }



  async runScheduledQuotaChecks() {
    this.debug("\n\n =============runScheduledQuotaChecks==========\n\n");

    if (await this.#fsbOptionsApi.isQuotaCheckSchedulingBlocked()) {
      this.infoAlways("\n\n=============Scheduled Quota Checks are BLOCKED - To Un-Block them, change the setting in the Storage Manager, then Re-Start Thunderbird");
      if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
        const parameters = { 'blocked': true, };
        await this.#fsbEventLogger.logInternalEvent("runScheduledQuotaChecks", "info", parameters, "Blocked");
      }

    } else {
      this.infoAlways("\n\n=============Running Scheduled Quota Checks");

      await this.#initQuotaCheckParameters();

      if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
        await this.#fsbEventLogger.logInternalEvent("runScheduledQuotaChecks", "info", this.getCurrentQuotaCheckParameters(), "Started");
      }

      if (! this.#quotaCheckEnabled) {
        this.infoAlways("\nScheduled Quota Checks are DISABLED but can be Enabled - not starting the timing loop");
      }

      await this.#fsbOptionsApi.addOptionChangeListener( async (key, newValue, oldValue) => this.#quotaCheckOptionChanged(key, newValue, oldValue) );

      if (this.#quotaCheckEnabled) {
        this.infoAlways("\nScheduled Quota Checks are ENABLED - starting the timing loop");
        await this.#scheduleQuotaCheck(true); // start the timing loop
      }
    }
  }

  async #scheduleQuotaCheck(init, prevQuotaCheckParameters) {
    this.debug(`\n\n--- init=${init} prevQuotaCheckParameters`, prevQuotaCheckParameters);
    if (! this.#quotaCheckEnabled) {
      this.debug("Quota Check is DISABLED - Will NOT Schedule");
      if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
        const parameters = { 'enabled': false, };
        await this.#fsbEventLogger.logInternalEvent("scheduleQuotaCheck", "request", parameters, "Not Enabled");
      }

    } else {
      this.debug("Quota Check is ENABLED - Scheduling");

      const nextQuotaCheckTimeMS = this.getNextQuotaCheckTimeMS(init, prevQuotaCheckParameters);
      if (! nextQuotaCheckTimeMS) {
        this.error(`\n\n===== getNextQuotaCheckTimeMS() returned 0 =====\n\n`);

      } else {
        this.debug(`--- nextQuotaCheckTimeMS=${nextQuotaCheckTimeMS}`);

        const nowMS              = Date.now();
        const delayMS            = nextQuotaCheckTimeMS - nowMS
        const nextQuotaCheckTime = utils.formatMsToDateTime24HR(nextQuotaCheckTimeMS);
        const delay              = utils.formatMsToTimePeriod(delayMS);

        const result = `Quota Check: delayMS=${delayMS} delay="${delay}" nextQuotaCheckTimeMS=${nextQuotaCheckTimeMS} nextQuotaCheckTime="${nextQuotaCheckTime}"`;
        this.debugAlways(`\n-- Setting up next Scheculed Quota Check Timeout -- ${result}`);
        this.#scheduledQuotaCheckTimeout = setTimeout( () => this.#scheduledQuotaCheckTimeoutTimedOut(nowMS, nextQuotaCheckTimeMS, delayMS), delayMS );
        const timeout = this.#scheduledQuotaCheckTimeout;

        this.debug(`\n-- Set up next Scheculed Quota Check Timeout -- timeout="${timeout}"`);

        if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
          const parameters = { 'delayMS': delayMS, 'delay': delay, 'nextQuotaCheckTime': nextQuotaCheckTime };
          await this.#fsbEventLogger.logInternalEvent("scheduleQuotaCheck", "request", parameters, `timeout="${timeout}"`);
        }
      }
    }
  }

  async #quotaCheckParameterChanged(unitChanged) {
    const timeout = this.#scheduledQuotaCheckTimeout;
    this.#scheduledQuotaCheckTimeout = undefined;
    if (timeout) clearTimeout(timeout);
    this.debug(`unitChanged=${unitChanged} CANCELED timeout="${timeout}", getting previous parameters, saving the new parameters, and resetting the timing loop`);

    const prevQuotaCheckParameters = this.getCurrentQuotaCheckParameters();
    this.#createQuotaCheckParameters();

    await this.#scheduleQuotaCheck(unitChanged, prevQuotaCheckParameters); // reset the timing loop
  }

  async #cancelScheduledQuotaCheck() {
    const timeout = this.#scheduledQuotaCheckTimeout;
    this.#scheduledQuotaCheckTimeout = undefined;
    if (timeout) clearTimeout(timeout);
    this.debug(`CANCELED timeout="${timeout}"`);

    if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
      const parameters = { 'enabled': this.#quotaCheckEnabled, 'canceled': true, };
      await this.#fsbEventLogger.logInternalEvent("scheduleQuotaCheck", "info", parameters, `Canceled timeout="${timeout}"`);
    }
  }

  async #scheduledQuotaCheckTimeoutTimedOut(scheduledTimeMS, quotaCheckTimeMS, delayMS) {
    const timeout = this.#scheduledQuotaCheckTimeout;
    this.#scheduledQuotaCheckTimeout = undefined;
    if (timeout) clearTimeout(timeout);

    const scheduledTime  = utils.formatMsToDateTime24HR(scheduledTimeMS);
    const quotaCheckTime = utils.formatMsToDateTime24HR(quotaCheckTimeMS);
    const delay          = utils.formatMsToTimePeriod(delayMS);
    const result         = `Timed out after ${delayMS}ms "${delay}" -- Scheduled at "${scheduledTime}" for "${quotaCheckTime}" timeout="${timeout}" enabled=${this.#quotaCheckEnabled}`;
    this.debugAlways(`-- ${result}`);

    if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
      const parameters = { 'delayMs': delayMS, 'delay': delay, 'scheduledTime': scheduledTime, 'quotaCheckTime': quotaCheckTime, 'enabled': this.#quotaCheckEnabled, };
      await this.#fsbEventLogger.logInternalEvent("scheduleQuotaCheck", "success", parameters, `timeout="${timeout}"`);
    }

    if (! this.#quotaCheckEnabled) {
      this.debug("Quota Check is DISABLED - Will NOT call #dispatchScheduledQuotaCheckEvent() & #scheduleQuotaCheck()");
    } else {
      this.debug("Quota Check is ENABLED - Calling #dispatchScheduledQuotaCheckEvent() & #scheduleQuotaCheck() to set the next timeout");
      this.#dispatchScheduledQuotaCheckEvent();
      await this.#scheduleQuotaCheck(false); // next!!!
    }
  }

  #dispatchScheduledQuotaCheckEvent() {
    this.debug("-- begin");
    const scheduledQuotaCheckEvent = new Event('ScheduledQuotaCheck');
    this.#scheduledQuotaCheckEventDispatcher.dispatchEvent(scheduledQuotaCheckEvent);
    this.debug("-- end");
  }

  async #onScheduledQuotaCheckEvent() {
    this.debug("-- begin");
    await this.#processScheduledQuotaChecks();
    this.debug("-- end");
  }

  async #processScheduledQuotaChecks() {
    this.debug("-- begin");
    if (! this.#quotaCheckEnabled) {
      this.debug("Quota Check is DISABLED - Will NOT Call processQuotas()");
    } else {
      this.debug("Quota Check is ENABLED - Calling processQuotas()");
      if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) await this.#fsbEventLogger.logInternalEvent("processQuotaChecks", "request", null, "");
      const response = await this.processQuotas();
      this.debugAlways("\n===== processQuotas() response:", response);
      if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) await this.#fsbEventLogger.logInternalEvent("processQuotaChecks", "success", null, "");
    }
    this.debug("-- end");
  }



  async #quotaCheckOptionChanged(key, newValue, oldValue) {
    if (key && key.startsWith("fsbQuotaCheck")) {
      this.debug(`\n--- Quota Check Scheduling Option Changed: key="${key}":  newValue=${newValue}  <--  oldValue=${oldValue}`)

      switch (key) {
        case 'fsbQuotaCheckSchedulingBlocked':
          await this.#quotaChecksBlockedChanged(newValue, oldValue);
          break;
        case 'fsbQuotaCheckEnabled':
          await this.#quotaCheckEnabledChanged(newValue, oldValue);
          break;
        case 'fsbQuotaCheckUnit':
          await this.#quotaCheckUnitChanged(newValue, oldValue);
          break;
        case 'fsbQuotaCheckDays':
          await this.#quotaCheckDaysChanged(newValue, oldValue);
          break;
        case 'fsbQuotaCheckDaysTimeOffset':
          await this.#quotaCheckDaysTimeOffsetChanged(newValue, oldValue);
          break;
        case 'fsbQuotaCheckHours':
          await this.#quotaCheckHoursChanged(newValue, oldValue);
          break;
        case 'fsbQuotaCheckHoursMinuteOffset':
          await this.#quotaCheckHoursMinuteOffsetChanged(newValue, oldValue);
          break;
        case 'fsbQuotaCheckMinutes':
          await this.#quotaCheckMinutesChanged(newValue, oldValue);
          break;
        case 'fsbQuotaCheckMinutesMinuteOffset':
          await this.#quotaCheckMinutesMinuteOffsetChanged(newValue, oldValue);
          break;
        default:
          this.error(`Unknown Option Key: "${key}"`);
      }
    }
  }

  async #quotaChecksBlockedChanged(newValue, oldValue) {
    if ((typeof newValue) === 'boolean') {
      if (newValue) {
        try {
          await this.#fsbOptionsApi.removeOptionChangeListener(this.#quotaCheckOptionChanged);
        } catch (error) {}

        await this.#cancelScheduledQuotaCheck();
        this.infoAlways("Scheduled Quota Checks have been BLOCKED");

        if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
          const parameters = { 'blocked': true, 'optionChange': true };
          await this.#fsbEventLogger.logInternalEvent("runScheduledQuotaChecks", "info", parameters, "BLOCKED");
        }
      } else if (false) {
        await this.runScheduledQuotaChecks();
        this.infoAlways("Scheduled Quota Checks have been UN-BLOCKED");

        if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
          const parameters = { 'unblocked': true, 'optionChange': true };
          await this.#fsbEventLogger.logInternalEvent("runScheduledQuotaChecks", "info", parameters, "UNBLOCKED");
        }
      }
    }
  }

  async #blockQuotaChecks() { // make this public eventually
    const KEY ='fsbQuotaCheckSchedulingBlocked' 
    this.fsbOptionsApi.saveOption(KEY, true); // should we await?
    if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
      const parameters = { 'blocked': true, 'external': true };
      await this.#fsbEventLogger.logInternalEvent("runScheduledQuotaChecks", "info", parameters, "BLOCKED");
    }
  }

  async #unblockQuotaChecks() { // make this public eventually?  Has no efffect until we actually implement a way to un-block
    const KEY ='fsbQuotaCheckSchedulingBlocked' 
    this.fsbOptionsApi.saveOption(KEY, false); // should we await?
    if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
      const parameters = { 'unblocked': true, 'external': true };
      await this.#fsbEventLogger.logInternalEvent("runScheduledQuotaChecks", "info", parameters, "UN-BLOCKED");
    }
  }

  // just change the option
  async #quotaCheckEnabledChanged(newValue, oldValue) {
    if ((typeof newValue) === 'boolean') {
      if (this.#quotaCheckEnabled !== newValue) {
//      const currentValue = this.#quotaCheckEnabled;
        this.#quotaCheckEnabled = newValue;
        if (! newValue) { // CHANGED TO NOT ENABLED?
          await this.#cancelScheduledQuotaCheck();
          this.infoAlways("Scheduled Quota Checks have been DISABLED - canceled the timing loop");

          if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
            const parameters = { 'disabled': true, 'optionChange': true };
            await this.#fsbEventLogger.logInternalEvent("runScheduledQuotaChecks", "info", parameters, "DISABLED");
          }
        } else { // CHANGED TO ENABLED
          if (this.#scheduledQuotaCheckTimeout) {
            this.error("\n\n\===== #quotaCheckEnabled is changing to true BUT #scheduledQuotaCheckTimeout exists AND #quotaCheckEnabled is false!!! ===\n\n");
          }

          this.infoAlways("Scheduled Quota Checks have been RE-ENABLED - starting the timing loop");
          await this.#scheduleQuotaCheck(true); // start the timing loop

          if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
            const parameters = { 'enabled': true, 'optionChange': true };
            await this.#fsbEventLogger.logInternalEvent("runScheduledQuotaChecks", "info", parameters, "ENABLED");
          }
        }
      }
    }
  }

  // just change the option
  async #disableQuotaChecks() { // make this public eventually
    const KEY ='fsbQuotaCheckEnabled' 
    this.fsbOptionsApi.saveOption(KEY, false); // should we await?
    if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
      const parameters = { 'disabled': true, 'external': true };
      await this.#fsbEventLogger.logInternalEvent("runScheduledQuotaChecks", "info", parameters, "DISABLED");
    }
  }

  // just change the option
  async #enableQuotaChecks() { // make this public eventually
    const KEY ='fsbQuotaCheckEnabled' 
    this.fsbOptionsApi.saveOption(KEY, true); // should we await?
    if (this.#LOG_SCHEDULED_QUOTA_CHECK_EVENTS) {
      const parameters = { 'enabled': true, 'external': true };
      await this.#fsbEventLogger.logInternalEvent("runScheduledQuotaChecks", "info", parameters, "ENABLED");
    }
  }

  async #quotaCheckUnitChanged(newValue, oldValue) {
    if ((typeof newValue) === 'string') {
      this.debug(`newValue=${newValue} this.#quotaCheckUnit=${this.#quotaCheckUnit}`);

      switch (newValue) {
        case 'daily': // validate
        case 'hourly':
        case 'minutely':
          break;
        default:
         this.error(`Unknown Quota Check Unit: "${newValue}"`);
         return;
      }

      if (this.#quotaCheckUnit !== newValue) {
        this.debug(`QUOTA CHECK UNIT CHANGED: newValue=${newValue} this.#quotaCheckUnit=${this.#quotaCheckUnit}`);
        this.#quotaCheckUnit = newValue;
        await this.#quotaCheckParameterChanged(true);
      }
    }
  }

  async #quotaCheckDaysChanged(newValue, oldValue) {
    this.debug(`newValue=${newValue} this.#quotaCheckDays=${this.#quotaCheckDays}`);
    const numNewValue = Number(newValue);
    if (Number.isInteger(numNewValue)) {
      if (this.#quotaCheckDays !== numNewValue) {
        this.#quotaCheckDays = numNewValue;
        await this.#quotaCheckParameterChanged(false);
      }
    }
  }

  async #quotaCheckDaysTimeOffsetChanged(newValue, oldValue) {
    this.debug(`newValue=${newValue} this.#quotaCheckDaysTimeOffsetMS=${this.#quotaCheckDaysTimeOffsetMS}`);
    if ((typeof newValue) === 'string') {
      const newTimeMS = utils.timeToMS(newValue); // returns 0 if wrong time format!!! HH:MM[:SS]
      if (this.#quotaCheckDaysTimeOffsetMS !== newTimeMS) {
        this.#quotaCheckDaysTimeOffsetMS = newTimeMS;
        await this.#quotaCheckParameterChanged(false);
      }
    }
  }

  async #quotaCheckHoursChanged(newValue, oldValue) {
    this.debug(`newValue=${newValue} this.#quotaCheckHours=${this.#quotaCheckHours}`);
    const numNewValue = Number(newValue);
    if (Number.isInteger(numNewValue)) {
      if (this.#quotaCheckHours !== numNewValue) {
        this.#quotaCheckHours = numNewValue;
        await this.#quotaCheckParameterChanged(false);
      }
    }
  }

  async #quotaCheckHoursMinuteOffsetChanged(newValue, oldValue) {
    this.debug(`newValue=${newValue} this.#quotaCheckHoursMinuteOffset=${this.#quotaCheckHoursMinuteOffset}`);
    const numNewValue = Number(newValue);
    if (Number.isInteger(numNewValue)) {
      if (this.#quotaCheckHoursMinuteOffset !== numNewValue) {
        this.#quotaCheckHoursMinuteOffset = numNewValue;
        await this.#quotaCheckParameterChanged(false);
      }
    }
  }

  async #quotaCheckMinutesChanged(newValue, oldValue) {
    this.debug(`newValue=${newValue} this.#quotaCheckMinutes=${this.#quotaCheckMinutes}`);
    const numNewValue = Number(newValue);
    if (Number.isInteger(numNewValue)) {
      if (this.#quotaCheckMinutes !== numNewValue) {
        this.#quotaCheckMinutes = numNewValue;
        await this.#quotaCheckParameterChanged(false);
      }
    }
  }

  async #quotaCheckMinutesMinuteOffsetChanged(newValue, oldValue) {
    this.debug(`newValue=${newValue} this.#quotaCheckMinutesMinuteOffset=${this.#quotaCheckMinutesMinuteOffset}`);
    const numNewValue = Number(newValue);
    if (Number.isInteger(numNewValue)) {
      if (this.#quotaCheckMinutesMinuteOffset !== numNewValue) {
        this.#quotaCheckMinutesMinuteOffset = numNewValue;
        await this.#quotaCheckParameterChanged(false);
      }
    }
  }


  getNextQuotaCheckTimeMS(init, prevQuotaCheckParameters) {
    const unit        = this.#quotaCheckUnit;
    const unitChanged = init || (prevQuotaCheckParameters && prevQuotaCheckParameters.unit !== unit);
    this.debug(`unit="${unit}" unitChanged=${unitChanged}`);

    if (unitChanged) {
      this.#currentScheduledQuotaCheckDayMS    = undefined;
      this.#currentScheduledQuotaCheckHourMS   = undefined;
      this.#currentScheduledQuotaCheckMinuteMS = undefined;
    }

    switch (unit) {
      case 'daily':
        return this.getNextDailyQuotaCheckTimeMS(unitChanged, prevQuotaCheckParameters);
      case 'hourly':
        return this.getNextHourlyQuotaCheckTimeMS(unitChanged, prevQuotaCheckParameters);
      case 'minutely':
        return this.getNextMinutelyQuotaCheckTimeMS(unitChanged, prevQuotaCheckParameters);
    }

    this.error(`Unknown Quota Check Unit: "${unit}"`);
    return 0;
  }



  getNextDailyQuotaCheckTimeMS(init, prevQuotaCheckParameters) {
    const numDays              = this.#quotaCheckDays ? this.#quotaCheckDays : 1;
    const timeOffsetMS         = this.#quotaCheckDaysTimeOffsetMS;
    const daysChanged          = ! prevQuotaCheckParameters || ( prevQuotaCheckParameters.days             !== numDays      );
    const timeOffsetMSChanged  = ! prevQuotaCheckParameters || ( prevQuotaCheckParameters.daysTimeOffsetMS !== timeOffsetMS );
    this.debug(`\nDAILY: init=${init} numDays=${numDays} daysChanged=${daysChanged} timeOffsetMS=${timeOffsetMS} timeOffsetMSChanged=${timeOffsetMSChanged}`);

    if (init || daysChanged || timeOffsetMSChanged || ! this.#currentScheduledQuotaCheckDayMS) {
      const nowMS              = Date.now();
      const currentDayMS       = utils.getCurrentDayMS();
      let   initScheduleTimeMS = currentDayMS + timeOffsetMS; // today + offset is still today because offset max is 11:59:59 PM (23:59:59)
this.debug(`\nINIT DAILY: now=${utils.formatMsToTime(nowMS)} timeOffset=${utils.formatMsToElapsed(timeOffsetMS)} currentDay=${utils.formatMsToTime(currentDayMS)} with offset=${utils.formatMsToTime(initScheduleTimeMS)} `);

      if (initScheduleTimeMS >= nowMS) { // if it's after now, just use it.
        //
      } else { // otherwise start tomorrow
        initScheduleTimeMS = currentDayMS + utils.DAY_MS + timeOffsetMS; // today + one day + offset
      }
this.debug(`\nINIT DAILY SCHEDULE TIME: ${utils.formatNowToDateTime24HR(initScheduleTimeMS)} `);

      this.#currentScheduledQuotaCheckDayMS = initScheduleTimeMS;
      return initScheduleTimeMS;
    }

////const nextScheduleTimeMS = utils.getDayMS(this.#currentScheduledQuotaCheckDayMS, numDays);   // MABXXX just add the number days to last time???
    const nextScheduleTimeMS = this.#currentScheduledQuotaCheckDayMS + (numDays * utils.DAY_MS); // MABXXX just add the number days to last time???
this.debug(`\nNEXT DAILY SCHEDULE TIME: ${utils.formatNowToDateTime24HR(nextScheduleTimeMS)} `);

    this.#currentScheduledQuotaCheckDayMS = nextScheduleTimeMS;
    return nextScheduleTimeMS;
  }



  getNextHourlyQuotaCheckTimeMS(init, prevQuotaCheckParameters) {
    const numHours             = this.#quotaCheckHours ? this.#quotaCheckHours : 4;
    const minutesOffset        = this.#quotaCheckHoursMinuteOffset;
    const hoursChanged         = ! prevQuotaCheckParameters || ( prevQuotaCheckParameters.hours             !== numHours      );
    const minutesOffsetChanged = ! prevQuotaCheckParameters || ( prevQuotaCheckParameters.hoursMinuteOffset !== minutesOffset );
    this.debug(`\nHOURLY: init=${init} numHours=${numHours} hoursChanged=${hoursChanged} minutesOffset=${minutesOffset} minutesOffsetChanged=${minutesOffsetChanged}`);

    if (init || hoursChanged || minutesOffsetChanged || ! this.#currentScheduledQuotaCheckHourMS) {
      const nowMS              = Date.now();
      const minutesOffsetInMS = minutesOffset * utils.MINUTE_MS;
      const currentHourMS      = utils.getCurrentHourMS();   // get the current hour
      let   initScheduleTimeMS = currentHourMS + minutesOffsetInMS;
this.debug(`\nINIT HOURLY: now=${utils.formatMsToTime(nowMS)} offsetInMS=${minutesOffsetInMS} offset=${utils.formatMsToElapsed(minutesOffsetInMS)} currentHour=${utils.formatMsToTime(currentHourMS)} initSchedule=${utils.formatMsToDateTime24HR(initScheduleTimeMS)} `);

      if (initScheduleTimeMS < nowMS) {
        initScheduleTimeMS += utils.HOUR_MS; // next hour
      }
this.debug(`\nINIT HOURLY SCHEDULE TIME: ${utils.formatMsToDateTime24HR(initScheduleTimeMS)} `);

      this.#currentScheduledQuotaCheckHourMS = initScheduleTimeMS;
      return initScheduleTimeMS;
    }

////const nextScheduleTimeMS = utils.getHourMS(this.#currentScheduledQuotaCheckHourMS, numHours);   // MABXXX just add the number hours to last time???
    const nextScheduleTimeMS = this.#currentScheduledQuotaCheckHourMS + (numHours * utils.HOUR_MS); // MABXXX just add the number hours to last time???
this.debug(`\nNEXT HOURLY SCHEDULE TIME: ${utils.formatMsToDateTime24HR(nextScheduleTimeMS)} `);

    this.#currentScheduledQuotaCheckHourMS = nextScheduleTimeMS;
    return nextScheduleTimeMS;
  }



  getNextMinutelyQuotaCheckTimeMS(init, prevQuotaCheckParameters) {
    const numMinutes           = this.#quotaCheckMinutes ? this.#quotaCheckMinutes : 15;
    const minutesOffset        = this.#quotaCheckMinutesMinuteOffset;
    const minutesChanged       = ! prevQuotaCheckParameters || ( prevQuotaCheckParameters.minutes             !== numMinutes    );
    const minutesOffsetChanged = ! prevQuotaCheckParameters || ( prevQuotaCheckParameters.minutesMinuteOffset !== minutesOffset );
    this.debug(`\nMINUTELY: init=${init} numMinutes=${numMinutes} minutesChanged=${minutesChanged} minutesOffset=${minutesOffset} minutesOffsetChanged=${minutesOffsetChanged}`);

    if (init || minutesChanged || minutesOffsetChanged || ! this.#currentScheduledQuotaCheckMinuteMS) {
      const nowMS              = Date.now();
      const minutesInMS        = numMinutes * utils.MINUTE_MS;
      const minuteOffsetInMS   = minutesOffset * utils.MINUTE_MS;
      const currentHourMS      = utils.getHourMS(nowMS, 0);
      const currentMinuteMS    = utils.getMinuteMS(nowMS, 1);
      let   initScheduleTimeMS = currentHourMS + minuteOffsetInMS;
this.debug(`\nINIT MINUTELY: now=${utils.formatMsToTime(nowMS)} numMinutes=${numMinutes} offset=${utils.formatMsToElapsed(minuteOffsetInMS)} currentHour=${utils.formatMsToTime(currentHourMS)} currentMinute=${utils.formatMsToTime(currentMinuteMS)} initScheduleTimeMS=${utils.formatMsToTime(initScheduleTimeMS)} (with offset)`);

      if (minutesInMS) { // sould always be number of minutes
        do { initScheduleTimeMS += minutesInMS; } while (initScheduleTimeMS < nowMS);
      } else if (false) {
        initScheduleTimeMS = currentMinuteMS;
      }
this.debug(`\nINIT MINUTELY SCHEDULE TIME: ${utils.formatMsToDateTime24HR(initScheduleTimeMS)} `);

      this.#currentScheduledQuotaCheckMinuteMS = initScheduleTimeMS;
      return initScheduleTimeMS;
    }

////const nextScheduleTimeMS = utils.getMinuteMS(this.#currentScheduledQuotaCheckMinuteMS, numMinutes);   // MABXXX just add the number minutes to last time???
    const nextScheduleTimeMS = this.#currentScheduledQuotaCheckMinuteMS + (numMinutes * utils.MINUTE_MS); // MABXXX just add the number minutes to last time???
this.debug(`\nNEXT MINUTELY SCHEDULE TIME: ${utils.formatMsToDateTime24HR(nextScheduleTimeMS)} `);

    this.#currentScheduledQuotaCheckMinuteMS = nextScheduleTimeMS;
    return nextScheduleTimeMS;
  }
}
