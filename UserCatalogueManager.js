#!/usr/bin/env node

/**
 * Command Line to maintain catalogue.json
 *
 * @author:  Nicolas DUPRE
 * @relase:  03/11/2021
 * @version: v0.3.2
 *
 *
 *
 *  Command to create a new session with settings :
 *
 *      --dir='/s/TC_DATA/Technical/Users/' --add-session=SESSION_DUPRENI
 *      --dir='/s/TC_DATA/Technical/Users/' --set-session --session=SESSION_DUPRENI --credential=saplogon --user=DUPRENI
 *      --dir='/s/TC_DATA/Technical/Users/' --set-session --session=SESSION_DUPRENI --credential=fms_ihm --user=DUPRENI
 *      --dir='/s/TC_DATA/Technical/Users/' --set-session --session=SESSION_DUPRENI --credential=mii --user=DUPRENI
 *
 *
 *  Command to delete a session  :
 *
 *      --dir='/s/TC_DATA/Technical/Users/' --delete-session=SESSION_DUPRENI
 *
 *
 *  Command to create new credential system
 *
 *      --dir='/s/TC_DATA/Technical/Users/' --add-credential=github --setting=darktheme:true --setting=repository:/myrepo.git
 *
 *
 *  Command to delete credential system
 *
 *      --dir='/s/TC_DATA/Technical/Users/' --delete-credential=github
 *
 *
 *
 *
 *  Command to set password
 *
 *      --dir='/s/TC_DATA/Technical/Users/' --set-user-password --credential=saplogon --user=DUPRENI --password=xxx
 *      --dir='/s/TC_DATA/Technical/Users/' --set-user-password --credential=fms_ihm --user=DUPRENI --password=yyy
 *      --dir='/s/TC_DATA/Technical/Users/' --set-user-password --credential=mii --user=DUPRENI --password=zzz
 *
 *
 *
 *
 * Version v0.1.0 - 03/11/2021 :
 * ------------------------------
 *  • Initial Releases
 *
 *
 *
 */

/**
 * Load dependencies
 */
const opt         = require('ifopt');
const fs          = require('fs');
const UserManager = require('./UserManager');


// Set Binary settings
const options = {
    separator: ",",
    shortopt: "d:vDhf:",
    longopt: [
        "dir:",
        "file:",
        "debug",
        "verbose",
        "help",
        "add-session:",
        "delete-session:",
        "set-session",
        "add-credential:",
        "delete-credential:",
        "set-user-password",
        "session:",
        "credential:",
        "setting:",
        "user:",
        "password:",
        "init"
    ]
};



/**
 * Global Variables.
 */
let SHOWHELP = true;
let DEBUG    = false;
let VERBOSE  = false;
let OPTS     = [];

let log      = opt.log;
let clog     = console.log;
let cdir = function (object) {
    console.dir(object, {depth: null});
};


/**
 * Binary Internal Function
 */

/**
 * Display binary help
 */
function help(level = 0) {
    let name = 'UserCatalogueManager';
    let helpText = `
Usage : ${name} [IFILE] [OPTIONS]
------------------------------------------------------------

{{${name}}} let maintain catalogue.json for TestComplete.

Implicits Options :

{{IFILE}}   Name of the file which contains users.

Explicits Options :

{{-h}}, {{--help}}        Display this text.
{{-d}}, {{--dir}}         Folder location containing catalogue.json file.
{{-f}}, {{--file}}        Name of the file containing the catalogue.
                    Default : {{catalogue.json}}
{{-v}}, {{--verbose}}     Turn on verbose mode.
{{-D}}, {{--debug}}       Turn on debug mode.

Setting Up
    {{--init}}            Create an initial catalogue file. Work with
                          {{-f}} ({{--file}}).

Session Group Maintenance :
    {{--add-session}}     Create a new session group in the catalogue.
    {{--delete-session}}  Remove the session group in the catalogue.
    {{--set-session}}     Edit session group :
       {{--session}}        - Session to maintain.
       {{--credential}}     - Specify which credential system to maintain.
       {{--user}}           - User to set for credential system.
       {{--password}}       - [Optional] Set/Update password for the user,
                          for credential
                          
Credential System Maintenance :
    ! Adding, removing credential system will be reflected 
    for each session group.
    
    {{--add-credential}}  Register a new / Update a credential system.
       {{--setting}}        - [Optional] Specify a setting where 'key:value'.
                          Can be use none to many.
    {{--delete-credential}}  Delete specified credential system.
    
User password Maintenance :
    {{--set-user-password}}  Set/Update password for user of credential system :
       {{--credential}}     - Specify which credential system to maintain.
       {{--user}}           - User to set for credential system.
       {{--password}}       - Password to define.
    
    `;

    helpText = helpText.replace(
        /{{(.*?)}}/g,
        `${opt.colors.fg.Yellow}$1${opt.colors.Reset}`
    );

    console.log(helpText);
    if (level) process.exit();
}

/**
 * Check if the processing can be performed.
 *
 * @return {boolean}
 */
function canRun() {
    if (opt.isOption(['init'])) {
        return true
    }

    // Simple Cases
    if (opt.isOption([
        'add-session',
        'delete-session',
        'add-credential',
        'delete-credential'
    ])) {
        return true;
    }

    // Conditions for session maintenance.
    if (opt.isOption([
        'set-session',
        'session',
        'credential',
        'user'
    ], 'and')) {
        return true;
    }

    // Condition for password maintenance.
    return !!opt.isOption([
        'set-user-password',
        'credential',
        'user',
        'password'
    ], 'and');
}

/**
 * Get the file content of the provided file path.
 *
 * @param {String}   file Path to the file we want to get the content.
 *
 * @return {String}  File content
 */
function getFileContent (file) {
    return fs.readFileSync(file, 'utf-8');
}

/**
 * Put the content in specified filepath
 *
 * @param {String} file
 * @param {String} content
 */
function putFileContent(file, content) {
    let fhandler = fs.createWriteStream(file, {});
    fhandler.write(content);
    fhandler.close();
}



/**
 * Options processing
 */
// Settings Implicit options
let implicits = {
    IFILE: 'catalogue.json',
    //OFILE: null
};
// Parse CLI received options
OPTS = opt.getopt(
    options.shortopt,
    options.longopt,
    ['IFILE', 'OFILE'],
    implicits
);

// Setting up VERBOSE Mode if specified.
if (opt.isOption(['verbose', 'v'])) {
    VERBOSE = true;
}

// Setting up DEBUG Mode if specified.
if (opt.isOption(['debug', 'D'])) {
    DEBUG = true;
}


// If processing can be performed, process file
if (canRun()) {
    let sDirPath        = opt.getOptValue(['dir', 'd']) || '';
    let sInputFilePath  = opt.getOptValue(['file', 'f']) || `${sDirPath}${implicits.IFILE}`;

    // Instantiate UserManager Instance
    let UserMgr = new UserManager().setUserCatalogueLocation(sInputFilePath);

    // Initialize Catalogue
    if (opt.isOption(['init'])) {
        let oBackup = UserMgr.logger;
        // Disable Logger.
        UserMgr.logger = function(){return {error: ()=>{}}};
        if(!UserMgr.initializeCatalogue()){
            opt.log("File %s already exists", 1, [sInputFilePath]);
        }
        UserMgr.logger = oBackup;
    }

    // Simple Case
    // --- Session Management
    if (opt.isOption(['add-session'])) {
        UserMgr.catalogue().session().add(opt.getOptValue(['add-session']));
    }
    if (opt.isOption(['delete-session'])) {
        UserMgr.catalogue().session(opt.getOptValue(['delete-session'])).delete();
    }
    // --- Credential Management
    if (opt.isOption(['add-credential'])) {
        let settings = {};
        opt.getOptsValues(['setting']).forEach(function ($setting) {
            let setting = $setting.split(':');
            settings[setting[0]] = setting[1];
        });

        UserMgr.catalogue().credential(opt.getOptValue(['add-credential'])).add(settings);
    }
    if (opt.isOption(['delete-credential'])) {
        UserMgr.catalogue().credential(opt.getOptValue(['delete-credential'])).delete();
    }


    // Complexe Cases
    // --- Session Management
    if (opt.isOption(['set-session'])) {
        let sSession    = opt.getOptValue('session');
        let sCredential = opt.getOptValue('credential');
        let sUser       = opt.getOptValue('user');
        let sPassword   = opt.getOptValue('password') || null;

        UserMgr.catalogue().session(sSession).credential(sCredential).user(sUser).set(sPassword);
    }

    // --- Password Management
    if (opt.isOption(['set-user-password'])) {
        let sCredential = opt.getOptValue('credential');
        let sUser       = opt.getOptValue('user');
        let sPassword   = opt.getOptValue('password');

        UserMgr.catalogue().credential(sCredential).user(sUser).setPassword(sPassword);
    }

    // Save modification
    UserMgr.catalogue().save();

    SHOWHELP = false;
}


// If nothing done, display help
if (SHOWHELP) {
    help();
    return true;
}
