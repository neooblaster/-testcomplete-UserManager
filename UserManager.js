// Check for NodeJS. If NodeJS, require need relative path
let sPrePath     = typeof process !== 'undefined' ? '@testcomplete/' : '';
let sPrePathRel  = typeof process !== 'undefined' ? './' : '';

let sjcl        = require(`sjcl`);
let base64      = require(`${sPrePathRel}Base64`);
let fs          = require(`${sPrePath}FileSystemUtil`);
let logger      = require(`${sPrePath}LoggerUtil`);
let lockManager = require(`${sPrePath}LockManager`);


/**
 * Version v0.3.0
 *
 * @author: Nicolas DUPRE (VISEO)
 *
 * Interface to handle Users for connexions using a Catalogue.
 * It allows concurrent run execution without using the same User at once.
 *
 * @return {UserManager} Constructor
 *
 * @constructor
 */
function UserManager() {
    let self = this;

    /**
     * @type {string} SJCL Crypting Passphrase.
     * @private
     */
    self._sPassphrase = 'TestComplete';

    /**
     * @type {String} Path to the folder which contains lock files.
     * @private
     */
    self._sLockFolderPath = null;

    /**
     * @type {Object} Path to the JSON File containing users.
     * @private
     */
    self._sUserCataloguePath = null;

    /**
     * @type {Object} Retrieve users for locked sessions.
     * @private
     */
    self._oUsers = null;

    /**
     * Initial base for catalogue to be function. Use by initializeCatalogue.
     *
     * @type {{common: {}, passwords: {}, group_sessions: {}}}
     * @private
     */
    self._oCatalogueBase = {
        "common": {},
        "group_sessions": {},
        "passwords": {}
    };

    /**
     * @type {Object} User catalogue.
     * @private
     */
    self._oCatalogue = null;

    /**
     * Lock File Util Manager (no time aspect required here)
     */
    self._lockManager = new lockManager().setTimeout(0).setInterval(0);

    /**
     * Define the path to the folder containing lock files.
     *Zth without ending /.
     *
     * @return {UserManager} Instance
     */
    self.setLockFolderLocation = function ($sLockFolderLocation) {
        // Memorize folder path
        self._sLockFolderPath = $sLockFolderLocation;

        // Setting Up Lock Manager Folder Path
        self._lockManager.setLockFolderPath(self._sLockFolderPath);

        return self;
    };

    /**
     * Define the path to the JSON file containing users.
     *
     * @param {String} $sUserCatalogueLocation Path to the user catalogue file.
     *
     * @return {UserManager} Instance
     */
    self.setUserCatalogueLocation = function ($sUserCatalogueLocation) {
        self._sUserCataloguePath = $sUserCatalogueLocation;

        return self;
    };

    self.catalogue = function () {
        if (!self._oCatalogue) {
            self.getUserCatalogue();
        }

        let oCatalogue = self._oCatalogue;

        /**
         * [X] session( ).add(x)
         * [X] session(x).delete()
         * [ ] session(x).rename(y)
         *
         * [ ] session(x).credential(y).user(z).set([p])
         * [ ] session(x).credential(y).user(z).password(p)
         *
         * [X] credential(x).add()
         * [X] credential(x).delete()
         * [ ] credential(x).rename(y)
         *
         * [X] credential(x).user(y).setPassword(z)
         *
         *
         */

        return {
            session: function ($sSession = '') {
                let oSession = null;

                if ($sSession) {
                    if (!oCatalogue.group_sessions[$sSession]) {
                        oSession = self.catalogue().session().add($sSession);
                    } else {
                        oSession = oCatalogue.group_sessions[$sSession];
                    }
                }

                return {
                    /**
                     * Add new session group.
                     *
                     * @param {String} $sSession  New Session group name.
                     */
                    add: function ($sSession) {
                        let oNewSession = {};

                        for (let sCredential in self._oCatalogue.common) {
                            oNewSession[sCredential] = '<setUser>';
                        }

                        return self._oCatalogue.group_sessions[$sSession] = oNewSession;
                    },

                    /**
                     * Remove session group from catalogue.
                     */
                    delete: function () {
                        if (oSession) {
                            delete self._oCatalogue.group_sessions[$sSession];
                        }

                        return self;
                    },

                    rename: function ($sNewSession) {
                        //[...x]
                    },

                    credential: function ($sCredential) {
                        //let oCredential = oSession[$sCredential];
                        if ($sCredential) {
                            if (oSession[$sCredential]) {
                                //oCredential = oSession[$sCredential];
                            } else {
                                self.logger().error(`Credential System '${$sCredential}' undefined in '${self._sUserCataloguePath}'`);
                            }
                        } else {
                            self.logger().error(`Please specified which Credential System to manage.`);
                        }

                        return {
                            user: function ($sUser) {
                                return {
                                    set: function ($sPassword = null) {
                                        if ($sUser) {
                                            oSession[$sCredential] = $sUser;
                                        }
                                        if ($sPassword !== null) {
                                            self.catalogue().credential($sCredential).user($sUser).setPassword($sPassword);
                                        }
                                    },

                                    password: function ($sPassword = null) {
                                        self.catalogue().credential($sCredential).user($sUser).setPassword($sPassword);
                                    }
                                }
                            }
                        }

                    }
                };
            },

            credential: function ($sCredential = '') {
                return {
                    /**
                     * Register a new credential system in the user catalogue.
                     *
                     * @param {String} $oSetting   Common settings for the new cred system.
                     * @param {String} $sUser      Set default user for new cred system.
                     * @param {String} $sPassword  Password for default user.
                     */
                    add: function ($oSetting = {}, $sUser = '<setUser>', $sPassword = '') {
                        // Adding / Updating common settings
                        if (!self._oCatalogue.common[$sCredential]) {
                            self._oCatalogue.common[$sCredential] = {};
                        }
                        self._oCatalogue.common[$sCredential] = Object.assign(self._oCatalogue.common[$sCredential], $oSetting);

                        // Update Session Group to add credential systems
                        for (let oSession in self._oCatalogue.group_sessions) {
                            self._oCatalogue.group_sessions[oSession][$sCredential] = $sUser;
                        }

                        // Update / Set default user password
                        if (!self._oCatalogue.passwords[$sCredential]) {
                            self._oCatalogue.passwords[$sCredential] = {};
                        }
                        self.catalogue().credential($sCredential).user($sUser).setPassword($sPassword);
                    },

                    /**
                     * Delete credential system from user catalogue.
                     */
                    delete: function () {
                        // Delete cred system for common settings
                        if (self._oCatalogue.common[$sCredential]) {
                            delete self._oCatalogue.common[$sCredential];
                        }
                        // Delete cred system for each session group
                        for (let sSession in self._oCatalogue.group_sessions) {
                            if (self._oCatalogue.group_sessions[sSession][$sCredential]) {
                                delete self._oCatalogue.group_sessions[sSession][$sCredential];
                            }
                        }
                        // Delete passwords
                        if (self._oCatalogue.passwords[$sCredential]) {
                            delete self._oCatalogue.passwords[$sCredential];
                        }
                    },

                    rename: function () {
                        //
                    },

                    /**
                     * User manager at credential system level
                     *
                     * @param {String} $sUser  Username to manage for the credential system.
                     *
                     * @return {{setPassword: setPassword}}
                     */
                    user: function ($sUser = '') {
                        return {
                            /**
                             * Set encrypted password for specified user under specified credential system
                             * @param {String} $sPassword  Password for the user
                             */
                            setPassword: function ($sPassword = '') {
                                if ($sCredential && $sUser) {
                                    if (!self._oCatalogue.passwords[$sCredential]) {
                                        self._oCatalogue.passwords[$sCredential] = {}
                                    }
                                    self._oCatalogue.passwords[$sCredential][$sUser] = base64.encode(
                                        sjcl.encrypt(self._sPassphrase, $sPassword)
                                    );
                                }
                            }
                        }
                    }
                }
            },

            /**
             * Save user catalogue.
             */
            save: function () {
                self.filePutContent(self._sUserCataloguePath, JSON.stringify(self._oCatalogue));
            }
        };
    };

    /**
     * File System for NodeJS & TestComplete compatibility.
     *
     * @return {{read: (function(*=): *), exists: exists, write: write}|{read: (function(*=): *), exists: (function(*=): *), write: (function(*=, *=): *)}}
     */
    self.fs = fs;

    /**
     * Logger System for NodeJS & TestComplete compatibility.
     *
     * @return {{warning: *, message: *, error: *}}
     */
    self.logger = logger;

    /**
     * Indicates if the UserManager interface has encounter an error (path issue).
     *
     * @return {boolean}
     */
    self.hasError = function () {
        return self._oUsers.runError;
    };

    /**
     * Get the content of the specified file.
     *
     * @param {String} $sFileLocation Path of the file to retrieve it content.
     *
     * @return {String} File content
     */
    self.fileGetContent = function ($sFileLocation) {
        return self.fs().read($sFileLocation);
    };

    /**
     * Clear and insert the provided string into specified file.
     *
     * @param {String} $sFileLocation Path to the file to write.
     * @param {String} $sContent      Content to insert in the file.
     */
    self.filePutContent = function ($sFileLocation, $sContent) {
        return self.fs().write($sFileLocation, $sContent);
    };

    /**
     * Get (& set if not exist) TestComplete ProjectSuite var containing run session users.
     *
     * @return {Object}
     */
    self.getStorageVar = function () {
        // Check if PJS Variable Exists
        if (!ProjectSuite.Variables.VariableExists('sUsers')) {
            ProjectSuite.Variables.AddVariable('sUsers', 'String');
            ProjectSuite.Variables.sUsers = JSON.stringify({
                runId: null,
                runError: false
            });
        }

        return self._oUsers = JSON.parse(ProjectSuite.Variables.sUsers);
    };

    /**
     * Generic definition to get user, password and extra setting for a system.
     *
     * @param {String} $sSystem Credential system to handle.
     */
    self.systemUser = function ($sSystem) {
        let oObject = {};

        oObject = Object.assign(oObject, self._oUsers[$sSystem]);
        oObject = Object.assign(oObject, {
            /**
             * Return the credential system user id.
             *
             * @return {string}
             */
            user: function () {
                return self._oUsers[$sSystem].user;
            },

            /**
             * Return the decrypt password of the credential system.
             *
             * @return {String}
             */
            password: function () {
                return sjcl.decrypt(self._sPassphrase, base64.decode(self._oUsers[$sSystem].password));
            },

            /**
             * Handle a flag indicating if the user is currently signed or not
             *
             * @return {{off: off, on: on}}
             */
            signed: function () {
                return {
                    /**
                     * Indicates the user is currently signed
                     */
                    on: function () {
                        self._oUsers[$sSystem].signed = true;

                        // Store new status
                        self.saveStorageVar();
                    },

                    /**
                     * Indicates the user is currently off
                     */
                    off: function () {
                        self._oUsers[$sSystem].signed = false;

                        // Store new status
                        self.saveStorageVar();
                    }
                }
            },

            /**
             * Return the signed status of the user.
             *
             * @return {oObject.signed|(function(): {off: off, on: on})|boolean}
             */
            isSigned: function () {
                return self._oUsers[$sSystem].signed;
            }
        });

        return oObject;
    };

    /**
     * Retrieve or get a new session users group for the run.
     *
     * @param {String} $sSessionGroup  Session group from user catalogue.
     *
     * @return {UserManager}
     */
    self.getUsers = function ($sSessionGroup) {
        //let sSessionGroupLockFile = null;
        let sSessionGroup = null;

        // Load User Catalogue
        let oCatalogue = self.getUserCatalogue();

        // Get for a valid sessions group
        if ($sSessionGroup) {
            //@TODO: [X] use LockManager.lockExists()
            // Check if Session Group is locked
            // sSessionGroupLockFile = `${self._sLockFolderPath}/${$sSessionGroup}`;
            //
            // if (self.fs().exists(sSessionGroupLockFile)) {
            //     sSessionGroup = $sSessionGroup;
            // }

            if (self._lockManager.isLockExists($sSessionGroup)) {
                sSessionGroup = $sSessionGroup;
            }
        }

        // If provided session is no longer locked,
        // Check for another one
        if (!sSessionGroup) {
            // Check for an available session group
            for (let sSession in oCatalogue.group_sessions) {
                if(!oCatalogue.group_sessions.hasOwnProperty(sSession)) continue;

                //@TODO: [X] use LockManager.lockExists()
                // sSessionGroupLockFile = `${self._sLockFolderPath}/${sSession}`;
                //
                // if (!self.fs().exists(sSessionGroupLockFile)) {
                //     sSessionGroup = sSession;
                //     break;
                // }

                if (!self._lockManager.isLockExists(sSession)) {
                    sSessionGroup = sSession;
                    break;
                }
            }
        }

        // Get Users & Lock Sessions
        if (sSessionGroup) {
            // @TODO: remove deprected next to test validation
            // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
            // let sRunIdLockFile = `${self._sLockFolderPath}/${self._oUsers.runId}`;
            // sSessionGroupLockFile = `${self._sLockFolderPath}/${sSessionGroup}`;

            // self.fs().write(sRunIdLockFile, sSessionGroup);
            // self.fs().write(sSessionGroupLockFile);
            // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

            self._lockManager.setLockName(self._oUsers.runId, sSessionGroup);
            self._lockManager.setLockName(sSessionGroup);

            self.logger().message(`Current execution (Lock '${self._oUsers.runId}') use session group '${sSessionGroup}'.`);
            
            let oCommons = self._oCatalogue.common;
            let oPasswords = self._oCatalogue.passwords;
            let oSessionUsers = self._oCatalogue.group_sessions[sSessionGroup];

            for (let system in oSessionUsers) {
                if(!oSessionUsers.hasOwnProperty(system)) continue;

                let oSystemCommon = oCommons[system] || {};
                let sUser = oSessionUsers[system] || '';
                let sPassword = oPasswords[system][sUser] || '';
                let bSigned = false;

                if (self._oUsers[system] && self._oUsers[system].hasOwnProperty('signed')) {
                    bSigned = self._oUsers[system].signed
                }

                self._oUsers[system] = Object.assign(oSystemCommon, {
                    user: sUser,
                    password: sPassword,
                    signed: bSigned
                });

                self[system] = self.systemUser.bind(self, system);
            }
        } else {
            // Check if Error already encounter to prevent loop.
            if (!self._oUsers.runError) {
                // Set Run as error encountered
                self._oUsers.runError = true;
                // Store new status
                self.saveStorageVar();
                // Log Error (Trigger Event)
                self.logger().error(`Not enough Session Group available for the run. Check folder '${self._sLockFolderPath}' or add more Sessions in '${self._sUserCataloguePath}'`);
            }
        }

        return self;
    };

    /**
     * Load User catalogue.
     *
     * @return {Object} Stored User Catalogue.
     */
    self.getUserCatalogue = function () {
        if (!self._sUserCataloguePath) {
            self.logger().error(`Path to the user catalogue is not define. Please use UserManager.setUserCatalogueLocation('/Path/to/catalogue.json').`);
        }

        if (!self.fs().exists(self._sUserCataloguePath)) {
            self.logger().error(`Path to the user catalogue '${self._sUserCataloguePath}' does not exists`);
        }

        try {
            return self._oCatalogue = JSON.parse(self.fileGetContent(self._sUserCataloguePath));
        } catch ($sErr) {
            self.logger.error(`Can not parse JSON file '${self._sUserCataloguePath}' : ${$sErr}`);
        }
    };

    /**
     * Initialize the base JSON file of the user catalogue.
     *
     * @return {boolean}
     */
    self.initializeCatalogue = function () {
        if (!self._sUserCataloguePath) {
            self.logger().error(`Path to the user catalogue is not define. Please use UserManager.setUserCatalogueLocation('/Path/to/catalogue.json').`);
            return false;
        }

        if (self.fs().exists(self._sUserCataloguePath)) {
            self.logger().error(`The user catalogue '${self._sUserCataloguePath}' already exists`);
            return false;
        } else {
            self.fs().write(self._sUserCataloguePath, JSON.stringify(self._oCatalogueBase));
            return true;
        }
    };

    /**
     * Save locked group session users.
     *
     * @return {boolean}
     */
    self.saveStorageVar = function () {
        ProjectSuite.Variables.sUsers = JSON.stringify(self._oUsers);

        return true;
    };

    /**
     * Load, retrieve/get a group session user.
     *
     * @return {UserManager}
     */
    self.getUserSessionGroup = function () {
        // Get Data
        let oUsers = self.getStorageVar();

        // Get & Check runId
        if (!oUsers.runId) {
            // Generates ID
            oUsers.runId = new Date().getTime();
        }

        // Check if there is a socket for this runId
        // @TODO: [X] LockManager lockExists
        // let sRunIdSocketPath = `${self._sLockFolderPath}/${oUsers.runId}`;
        // let sSessionGroup = null;

        //if (aqFile.Exists(sRunIdSocketPath)) {
        // if (self.fs().exists(sRunIdSocketPath)) {
        //     // Read file to find assigned Session Group
        //     sSessionGroup = self.fileGetContent(sRunIdSocketPath);
        // }

        let sSessionGroup = null;
        if (self._lockManager.isLockExists(oUsers.runId)) {
            sSessionGroup = self._lockManager.getLockContent(oUsers.runId);
        }

        // Load Users
        self.getUsers(sSessionGroup);

        // Save Data
        self.saveStorageVar();

        return self;
    };

    /**
     * Release session group user lock files.
     *
     * @return {UserManager}
     */
    self.releaseUserSessionGroup = function () {
        // Get Data
        let oUsers = self.getStorageVar();

        // Get Session Group & Release locks
        //let sRunIdLockPath = `${self._sLockFolderPath}/${oUsers.runId}`;

        // @TODO: [X] LockManager lockExists()
        //if (self.fs().exists(sRunIdLockPath)) {
        if (self._lockManager.isLockExists(oUsers.runId)) {
            //let sSessionGroup = self.fileGetContent(sRunIdLockPath);
            let sSessionGroup = self._lockManager.getLockContent(oUsers.runId);
            //let sSessionGroupLockFile = `${self._sLockFolderPath}/${sSessionGroup}`;

            // @TODO: [X] LockManager lockExists()
            //if (self.fs().exists(sSessionGroupLockFile)) {
            if (self._lockManager.isLockExists(sSessionGroup)) {
                //self.fs().delete(sSessionGroupLockFile);
                self._lockManager.release(sSessionGroup);
                self.logger().message(`Session group '${sSessionGroup}' has been released successfully.`);
            }

            //self.fs().delete(sRunIdLockPath);
            self._lockManager.release(oUsers.runId);
            self.logger().message(`Releasing run execution lock file '${oUsers.runId}'.`);
        }

        // Clear & Save
        self._oUsers = {
            runId: null,
            runError: false
        };

        // Save Data
        self.saveStorageVar();

        return self;
    };

    return self;
}

module.exports = UserManager;