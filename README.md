# TestComplete - UserManager

> A library that pick a credentials group session from a catalogue for a testing execution.

* **Version** : ``v0.3.0``
* **Dependencies** :
    * ``sjcl`` : [sjcl](https://www.npmjs.com/package/sjcl)
        * ``./node_modules/sjcl/sjcl.js``
    * ``Base64`` : Provided in the package
        * ``./Base64.js``
    * ``LockManager`` : [@testcomplete/lockmanager](https://www.npmjs.com/package/%40testcomplete%2Flockmanager)
        * ``./node_modules/@testcomplete/lockmanager/LockManager.js``
        * ``LockManager`` dependencies
    * ``LoggerUtil`` : [@testcomplete/loggerutil](https://www.npmjs.com/package/%40testcomplete%2Floggerutil)
        * ``./node_modules/@testcomplete/loggerutil/LoggerUtil.js``
    * ``Sleep`` : [@testcomplete/sleep](https://www.npmjs.com/package/%40testcomplete%2Fsleep)
        * ``./node_modules/@testcomplete/sleep/Sleep.js``
  
  
## Summary

[](BeginSummary)
* [Summary](#summary)
* [UserManager Setup for TestComplete](#usermanager-setup-for-testcomplete)
* [Get Started](#get-started)
    * [Creation of the catalogue file](#creation-of-the-catalogue-file)
    * [Setting Up credentials](#setting-up-credentials)
        * [First Step - Identifying & Setup of tested system](#first-step-identifying-&-setup-of-tested-system)
        * [Second Step - Register users for each credential system](#second-step-register-users-for-each-credential-system)
        * [Third Step - Create Group Session](#third-step-create-group-session)
        * [Fourth Step - Assign user to Group Session](#fourth-step-assign-user-to-group-session)
    * [Consuming credentials.](#consuming-credentials.)
        * [Retrieve Username & Password](#retrieve-username-&-password)
* [Command Line Interface (CLI)](#command-line-interface-cli)
    * [Catalogue file initialization](#catalogue-file-initialization)
    * [Setting up credential systems](#setting-up-credential-systems)
    * [Setting up users & password](#setting-up-users-&-password)
    * [Setting up user group session](#setting-up-user-group-session)
    * [Assign users to group session](#assign-users-to-group-session)
* [Detailed Documentation](#detailed-documentation)
[](EndSummary)



## UserManager Setup for TestComplete

As this library is published on **npmjs**,
you can easily get library with the following command
if you have **nodejs** installed on your computer.

````bash
npm install @testcomplete/usermanager
````

Please confer to this documentation to add script in TestComplete :

**Important** : For this library, all file must be in the same folder,
else the command line will not works.

Script List for the setup :

* ``./node_modules/@testcomplete/filesystemutil/FileSystemUtil.js``
* ``./node_modules/@testcomplete/loggerutil/LoggerUtil.js``
* ``./node_modules/@testcomplete/sleep/Sleep.js``
* ``./node_modules/@testcomplete/lockmanager/LockManager.js`` (Dependencies)
* ``./node_modules/@testcomplete/usermanager/Base64.js`` (From Package)
* ``./node_modules/@testcomplete/usermanager/UserManager.js`` (From Package)

[@testcomplete/testcompletelibrarysetup](https://www.npmjs.com/package/@testcomplete/testcompletelibrarysetup)



## Get Started

The purpose of this library is to manage a user catalogue where 
testing executions pick a group user session to prevent concurrent user usage.

The catalogue which stored users is a JSON file which can be easily created
with the library (or with the command line).

Managing feature provided by the command lines can be done by scripting,
but I advise to use the CLI, but that implies the installation of NodeJS.

In this **get stated** chapter, we will see how to initialize the catalogue.
Then we will see how to instantiate library and use credentials.
We will not see here how to maintain the catalogue.


### Creation of the catalogue file

This step must be done only once when you start with **UserManager**.
To be functional, you have to define a shared folder reachable by all
your TestComplete project to allow them picking a user from the catalogue.
You will also need another shared folder to store lock file indicating the
user group session is used.

So we will consider here we have a shared network device named ``S:/``.

For the creation we only need to setup the catalogue file location.

**Note**: You can perform the initialization with the command line interface.
Please confer to the chapter **Command Line Interface (CLI) > 
Catalogue file initialization**. The hereafter code is purpose for a dedicated
function to manage catalogue from **TestComplete** or for management rule.

````javascript
const UserManager = require('UserManager');

let UserMgr = new UserManager();

// Set Location to the catalogue file
UserMgr.setUserCatalogueLocation('S:/TC_DATA/Technical/Users/catalogue.json');

// Create Initial File
UserMgr.initializeCatalogue();
````

The initial JSON file is created with the following content :

````json
{
    "common": {},
    "group_sessions": {},
    "passwords": {}
}
````



### Setting Up credentials 

Please considering the instance of **UserManager** under ``UserMgr`` :

````javascript
const UserManager = require('UserManager');

let UserMgr = new UserManager().setUserCatalogueLocation('S:/TC_DATA/Technical/Users/catalogue.json');
````


#### First Step - Identifying & Setup of tested system

The main purpose of this library is to get a **set** of credential
user for all different systems you will test during the execution.

If your tested systems accept multiple connexion of the same user,
you not will probably need to implement the **UserManager** library.

If at least one tested system has licence control done on sign on and prevent
multiple connexions, you will resolve the situation by letting **UserManager**
picking a user group session from the catalogue.

Please considering your test works with 3 applications :

* The desktop application **SAPLOGON** where multiple connexion are not allowed
* The web application **SAP Fiori Launchpad** where multiple connexion are permitted
* A customer application available on the web **Supplier Portal** 

Here we have 3 different systems each with it own user. I call them
<span style="color: red;">**credential system**</span>. 

To create a
<span style="color: red;">**credential system**</span>
please call method as following

````javascript
// Creation of credential system 'saplogon' with common settings 'system', 'client' & 'lang'
UserMgr.catalogue().credential('saplogon').add({
    system: 'XOM',
    client: 120,
    lang: 'FR'
});

// Creation of credential system 'fiori' with no common settings
UserMgr.catalogue().credential('fiori').add();

// Creation of credential system 'supplier' with no common settings
UserMgr.catalogue().credential('supplier').add();

// Save modification
UserMgr.catalogue().save();
````

**Note**: Considering you have a function to manage credential system.

The result for the catalogue is the following :

````json
{
    "common": {
        "saplogon": {
            "system": "XOM",
            "client": "120",
            "lang": "FR"
        },
        "fiori": {},
        "supplier": {}
    },
    "group_sessions": {},
    "passwords": {
        "saplogon": {
            "<setUser>": "eyJpdiI6IjFtcllxSUhpRVp3Z0NlK04vQWdoWUE9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiJXeUFXUHlvZHFOYz0iLCJjdCI6ImV6R3lvYmFiR0RvPSJ9"
        },
        "fiori": {
            "<setUser>": "eyJpdiI6Imc5U1ZiK1F3amhVcHpjb0M4RDRqZXc9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiJXTlRDeHFIOGIvWT0iLCJjdCI6InF6eDl0TjE2QUhRPSJ9"
        },
        "supplier": {
            "<setUser>": "eyJpdiI6InJNK3hWR05jbG4zVWF6OXhnZm9vb2c9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiJLdnlBbWxjMmRvMD0iLCJjdCI6IitHNnE5aVMxWXlFPSJ9"
        }
    }
}
````

* <span style="color: red;">**credential system**</span> is identifiable
by its common settings and assigned users. So a dummy user is created.



#### Second Step - Register users for each credential system

Once you have listed and created all required credential systems,
you have to maintain users for all of them.

User creations simply consist to set password for named user for the 
specified <span style="color: red;">**credential system**</span> :

````javascript
// Handling Users for 'saplogon'
UserMgr.catalogue().credential('saplogon').user('TNR_USER_01').setPassword('TnR0101*');
UserMgr.catalogue().credential('saplogon').user('TNR_USER_02').setPassword('TnR0210.');
UserMgr.catalogue().credential('saplogon').user('TNR_USER_03').setPassword('TnR0411!');

// Handling Users for 'fiori'
UserMgr.catalogue().credential('fiori').user('TNR_USER_01').setPassword('TnRFlP0101*');
UserMgr.catalogue().credential('fiori').user('TNR_USER_02').setPassword('TnRFlP0210.');
UserMgr.catalogue().credential('fiori').user('TNR_USER_03').setPassword('TnRFlP0411!');

// Handling Users for 'supplier'
UserMgr.catalogue().credential('supplier').user('TNR_TECH_USER').setPassword('TnRSupplierLimited.');

// Save modification
UserMgr.catalogue().save();
````

The result of the catalogue next to the execution :

````json
{
    "common": {
        "saplogon": {
            "system": "XOM",
            "client": "120",
            "lang": "FR"
        },
        "fiori": {},
        "supplier": {}
    },
    "group_sessions": {},
    "passwords": {
        "saplogon": {
            "<setUser>": "eyJpdiI6IjFtcllxSUhpRVp3Z0NlK04vQWdoWUE9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiJXeUFXUHlvZHFOYz0iLCJjdCI6ImV6R3lvYmFiR0RvPSJ9",
            "TNR_USER_01": "eyJpdiI6IjAxam1BV3hhQm1hcStNUG9acVVETnc9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiJrNDZObW9sTlMxOD0iLCJjdCI6IjVwYkEyd0MyQmx0cWUyeFpFdzBjVEE9PSJ9",
            "TNR_USER_02": "eyJpdiI6Imh1STZwTUN3cFhRWVppZ0FpdEpNenc9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiJVMzlWemEyWlV0ST0iLCJjdCI6IlBRT1lrRUd2RnZxWTRoSy9jV3piU3c9PSJ9",
            "TNR_USER_03": "eyJpdiI6IkhCVUs3ZVhTS01sMFAyVmo4THExTEE9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiI3eUg4cU4xWFRwQT0iLCJjdCI6IjllQXBxb0FVbVl6WEZEb2EyNUN4Y2c9PSJ9"
        },
        "fiori": {
            "<setUser>": "eyJpdiI6Imc5U1ZiK1F3amhVcHpjb0M4RDRqZXc9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiJXTlRDeHFIOGIvWT0iLCJjdCI6InF6eDl0TjE2QUhRPSJ9",
            "TNR_USER_01": "eyJpdiI6IkszR3pkVWxVS2hrYkFqZllUL0h2YWc9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiJmdklBeGVVWnloTT0iLCJjdCI6ImVubkFhdWx4QUZxUHYrM1h0WjhkREQwWVd3PT0ifQ==",
            "TNR_USER_02": "eyJpdiI6IjdHZk8xSTJ3UXRDTEkzUGJ0WUlVUGc9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiJHNlpqT05OczBKaz0iLCJjdCI6Ik41TlVZVlhsVGlKYTIrZTdHM2dpWkNEQ0M0VT0ifQ==",
            "TNR_USER_03": "eyJpdiI6ImZlWUZBUE91TzVCbjNpYVJXb0NFQ2c9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiJDSDZXUHlrQWVVUT0iLCJjdCI6InlKQjR4NnF2bW91cmxVU05mRGkrNE1ITFBnPT0ifQ=="
        },
        "supplier": {
            "<setUser>": "eyJpdiI6InJNK3hWR05jbG4zVWF6OXhnZm9vb2c9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiJLdnlBbWxjMmRvMD0iLCJjdCI6IitHNnE5aVMxWXlFPSJ9",
            "TNR_TECH_USER": "eyJpdiI6IjQyZnpXTmRxLzFidTNZMGFsNmZ0dHc9PSIsInYiOjEsIml0ZXIiOjEwMDAwLCJrcyI6MTI4LCJ0cyI6NjQsIm1vZGUiOiJjY20iLCJhZGF0YSI6IiIsImNpcGhlciI6ImFlcyIsInNhbHQiOiIrRnR6d24wRXAxWT0iLCJjdCI6InNGT1N2TWZWdUdMaW5JTmlVY3hHWjVrbjNVUHFrMDF1MmxJPSJ9"
        }
    }
}
````



#### Third Step - Create Group Session

The **UserManager** will pick a group session to lock a set of user.
We have to create <span style="color: red;">**group sessions**</span>
to made set of user.

We will create three group session allowing three concurrent test execution.

````javascript
UserMgr.catalogue().session('GROUP_SESSION_01');
UserMgr.catalogue().session('GROUP_SESSION_02');
UserMgr.catalogue().session('GROUP_SESSION_03');

// Save modification
UserMgr.catalogue().save();
````

The result of the catalogue next to the execution :

````json
{
    "common": {
        "saplogon": {
            "system": "XOM",
            "client": "120",
            "lang": "FR"
        },
        "fiori": {},
        "supplier": {}
    },
    "group_sessions": {
        "GROUP_SESSION_01": {
            "saplogon": "<setUser>",
            "fiori": "<setUser>",
            "supplier": "<setUser>"
        },
        "GROUP_SESSION_02": {
            "saplogon": "<setUser>",
            "fiori": "<setUser>",
            "supplier": "<setUser>"
        },
        "GROUP_SESSION_03": {
            "saplogon": "<setUser>",
            "fiori": "<setUser>",
            "supplier": "<setUser>"
        }
    },
    "passwords": {
        (...)
    }
}
````



#### Fourth Step - Assign user to Group Session

The final step is to assign users to a group session.

A user can be used to none to many group session.

* Assign user ``TNR_USER_01`` of cred. system `saplogon` to group session `GROUP_SESSION_01` :

````javascript
// Assign user 'TNR_USER_01' of cred. system 'saplogon' to group session 'GROUP_SESSION_01'
UserMgr.catalogue().session('GROUP_SESSION_01').credential('saplogon').user('TNR_USER_01').set();

// Assign user 'TNR_USER_02' of cred. system 'saplogon' to group session 'GROUP_SESSION_02'
UserMgr.catalogue().session('GROUP_SESSION_02').credential('saplogon').user('TNR_USER_02').set();

// Assign user 'TNR_USER_03' of cred. system 'saplogon' to group session 'GROUP_SESSION_03'
UserMgr.catalogue().session('GROUP_SESSION_03').credential('saplogon').user('TNR_USER_03').set();
````

* Assign user ``TNR_USER_01`` of cred. system `fiori` to group session `GROUP_SESSION_01` :

````javascript
UserMgr.catalogue().session('GROUP_SESSION_01').credential('fiori').user('TNR_USER_01').set();
UserMgr.catalogue().session('GROUP_SESSION_02').credential('fiori').user('TNR_USER_02').set();
UserMgr.catalogue().session('GROUP_SESSION_03').credential('fiori').user('TNR_USER_03').set();
````

* Assign user ``TNR_TECH_USER`` of cred. system `supplier` to all group sessions :

````javascript
UserMgr.catalogue().session('GROUP_SESSION_01').credential('supplier').user('TNR_TECH_USER').set();
UserMgr.catalogue().session('GROUP_SESSION_02').credential('supplier').user('TNR_TECH_USER').set();
UserMgr.catalogue().session('GROUP_SESSION_03').credential('supplier').user('TNR_TECH_USER').set();
````

* Save your modifications

````javascript
// Save modification
UserMgr.catalogue().save();
````


````json
{
    "common": {
        "saplogon": {
            "system": "XOM",
            "client": "120",
            "lang": "FR"
        },
        "fiori": {},
        "supplier": {}
    },
    "group_sessions": {
        "GROUP_SESSION_01": {
            "saplogon": "TNR_USER_01",
            "fiori": "TNR_USER_01",
            "supplier": "TNR_TECH_USER"
        },
        "GROUP_SESSION_02": {
            "saplogon": "TNR_USER_02",
            "fiori": "TNR_USER_02",
            "supplier": "TNR_TECH_USER"
        },
        "GROUP_SESSION_03": {
            "saplogon": "TNR_USER_03",
            "fiori": "TNR_USER_03",
            "supplier": "TNR_TECH_USER"
        }
    },
    "passwords": {
        (...)
    }
}
````

**Important**: All steps can also be done from the **command line interface**
which is documented in the dedicated chapter **Command Line Interface (CLI)**.






### Consuming credentials.

> **Important** : Consuming credentials works only with **TestComplete**.

As the catalogue can be managed thanks to the **CLI**
or with your own implementation in **TestComplete** using previously describe
methods, this chapter is the most important to use by consuming user group session
from the catalogue.

When a user group session is picked by a test execution, the library
**UserManager** raised two lock files :

- A file with the user group session picked with an generated ID in its content.
- A file named with generated ID reserved for the test execution.

Both file allow the library to retrieve the appropriate user group session at
any time until the release statement is performed.

So before consuming the user catalogue, we have to setup the location
where the catalogue is and a folder path where you will store lock file.

````javascript
// Load Library
const UserManager = require('UserManager');

// Instantiate & Setup
let UserMgr = new UserManager().setUserCatalogueLocation(
    'S:/TC_DATA/Technical/Users/catalogue.json'           // Path to the file
).setLockFolderLocation(
    'S:/TC_DATA/Technical/Users/Locks'                    // Path to the folder
);
````

Once instance is configured, you can picked a user group session.
The user group session picking will return your instance
enriched with dynamic method reflecting your
<span style="color: red;">**credential system**</span>.

````javascript
UserMgr.getUserSessionGroup();
````

**Note**: There is no boolean returned for the method ``getUserSessionGroup``
because it's return the instance. In the case where there is no more group
session available (not able to acquire lock on group session),
an error message is raised in the log.


#### Retrieve Username & Password

As mentioned previously, the user group session enrich the instance
by creating dynamic method.

In our catalogue, with have three <span style="color: red;">**credential system**</span> :

- ``saplogon``
- ``fiori``
- ``supplier``

Each <span style="color: red;">**credential system**</span> is a method
that returning a object with these method :

- ``user()`` which returns the credential system user id.
- ``password()`` which returns the decrypt password of the credential system.
- ``signed()``  which allows handling of a flag indicating if the user is currently signed or not :
    -  ``on()`` which turning flag to `true` indicating connexion is up. 
    -  ``off()`` which turning flag to `false` indicating connexion has turned off.
- ``isSigned()`` returning `true` if you turn flag to signed or `false`
- ``<property>`` all global properties set in `common` for the <span style="color: red;">**credential system**</span> are accessible by using its name.
    

So considering the following script which perform **SAP Logon** connexion :

````javascript
// Perform SAP Connexion
Keyboard.on(Aliases.sapConn.Env)
    //.wait(500)
    .click()

    // SAP System ID
    .on(Aliases.sapConn.Env)
    .keys(UserMgr.saplogon().system)
    .enter()

    // SAP Client
    .on(Aliases.sapConn.Client)
    .keys(UserMgr.saplogon().client)

    // SAP User
    .on(Aliases.sapConn.User)
    .keys(UserMgr.saplogon().user())

    // SAP Password
    .on(Aliases.sapConn.Password)
    .keys(UserMgr.saplogon().password())

    // SAP Language
    .on(Aliases.sapConn.Language)
    .keys(UserMgr.saplogon().language)
    .enter()
    .wait(500)
    .run();

// From this point, signin is OK
UserMgr.saplogon().signed().on(); 
````


Please find below a code sample how to implement user group session release
which also works when an error occurs in TestComplete.

````javascript
let UserManager = require('UserManager');
let Deconnexion_gui = require('Deconnexion_gui');

/**
 * Release locks file set for the run execution.
 */
function ReleaseUserSessionGroup($bNextToError = false) {
    // Retrieve User Session group for usage status
    let oUserMgr = new UserManager().setLockFolderLocation(
        'S:/TC_DATA/Technical/Users/lock'
    ).setUserCatalogueLocation(
        'S:/TC_DATA/Technical/Users/catalogue.json'
    ).getUserSessionGroup();

    if ($bNextToError) oUserMgr.logger().warning('An error has occurred. Stopping execution...');

    // If user are used, perfrom signoff
    if (!oUserMgr.hasError() && oUserMgr.saplogon().isSigned()) {
        oUserMgr.logger().warning('Closing SAPLogon connexion to freed user.');
        Deconnexion_gui();
    }
    //We checked if the Browser is still on
    let nTimeout = Options.Run.Timeout;
    Options.Run.Timeout = 1000;
    if (Aliases.browser.BrowserWindow.Exists)
    {
      Aliases.browser.BrowserWindow.Close();
    }
    Options.Run.Timeout = nTimeout;

    // Release Lock File
    oUserMgr.releaseUserSessionGroup();
}

/**
 * TC Event OnStopTest which stop Project execution and call function to release
 * locks file to prevent usage of all group sessions.
 *
 * @param Sender
 */
function OnErrorReleaseLockFile_OnStopTest(Sender) {
    if (Project.Variables.gv_stop) {
        ReleaseUserSessionGroup(true);
        Runner.Stop();
    }
}
````






## Command Line Interface (CLI)

To simplify the catalogue maintenance, 
**UserManager** is provided with a **command line interface**

To use CLI, you need **NodeJs** is installed. 

I will suppose that **NodeJs** is installed because, we use
**npm** to install dependencies.

The CLI file is ``UserCatalogueManager.js`` which is available in the root 
folder next to ``UserManager.js``

You can place the script file anywhere on your computer until you update 
the line ``59`` which is pointing to the main library **UserManager.js**

````javascript
// Update path to UserManager.js
const UserManager = require('./UserManager'); // Here, in same location
````

Once CLI file is setup, open a **Bash** interface or a Windows command
**cmd.exe**.

In the command window, browser to the location of file ``UserCatalogueManager.js``.

Call script without any options to get help :

````bash
./UserCatalogueManager.js
````

````plaintext
Usage : UserCatalogueManager [IFILE] [OPTIONS]
------------------------------------------------------------

UserCatalogueManager let maintain catalogue.json for TestComplete.

Implicits Options :

IFILE   Name of the file which contains users.

Explicits Options :

-h, --help        Display this text.
-d, --dir         Folder location containing catalogue.json file.
-f, --file        Name of the file containing the catalogue.
                    Default : catalogue.json
-v, --verbose     Turn on verbose mode.
-D, --debug       Turn on debug mode.

Setting Up
    --init            Create an initial catalogue file. Work with
                          -f (--file).

Session Group Maintenance :
    --add-session     Create a new session group in the catalogue.
    --delete-session  Remove the session group in the catalogue.
    --set-session     Edit session group :
       --session        - Session to maintain.
       --credential     - Specify which credential system to maintain.
       --user           - User to set for credential system.
       --password       - [Optional] Set/Update password for the user,
                          for credential

Credential System Maintenance :
    ! Adding, removing credential system will be reflected
    for each session group.

    --add-credential  Register a new / Update a credential system.
       --setting        - [Optional] Specify a setting where 'key:value'.
                          Can be use none to many.
    --delete-credential  Delete specified credential system.

User password Maintenance :
    --set-user-password  Set/Update password for user of credential system :
       --credential     - Specify which credential system to maintain.
       --user           - User to set for credential system.
       --password       - Password to define.

````

Please find from now a quick explanation to reproduce the same
catalogue setting done with JavaScript but with the CLI. 



### Catalogue file initialization

Before handling the catalogue, we have to create the file :

````bash
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --init
````



### Setting up credential systems

We have to start by setting up credential system before
configuring their users and password :

````bash
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --add-credential=saplogon --setting=system:XOM --setting=client:120 --setting=lang:FR
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --add-credential=fiori 
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --add-credential=supplier
````



### Setting up users & password

Users & Passwords are configured at credential system.
So we have to specified which credential system is currently maintained
where we will add (or update if exists) the correspinding password.

````bash
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-user-password --credential=saplogon --user=TNR_USER_01 --password=TnR0101*
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-user-password --credential=saplogon --user=TNR_USER_02 --password=TnR0210.
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-user-password --credential=saplogon --user=TNR_USER_03 --password=TnR0411!
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-user-password --credential=fiori --user=TNR_USER_01 --password=TnRFlP0101*
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-user-password --credential=fiori --user=TNR_USER_02 --password=TnRFlP0210.*
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-user-password --credential=fiori --user=TNR_USER_03 --password=TnRFlP0411!
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-user-password --credential=supplier --user=TNR_TECH_USER --password=TnRSupplierLimited
````


### Setting up user group session

Before assigning previously created user, we have to declare
the name of group session which will be picked by the library
**UserManager** :

````bash
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --add-session=GROUP_SESSION_01
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --add-session=GROUP_SESSION_02
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --add-session=GROUP_SESSION_03
````


### Assign users to group session

The command line will automatically set a dummy user for each
credential system when a new one is created and/or when
we create a new group user session.

We have to specify for each credential system, for each group session
which user must be used :

````bash
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-session --session=GROUP_SESSION_01 --credential=saplogon --user=TNR_USER_01
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-session --session=GROUP_SESSION_02 --credential=saplogon --user=TNR_USER_02
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-session --session=GROUP_SESSION_03 --credential=saplogon --user=TNR_USER_03
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-session --session=GROUP_SESSION_01 --credential=fiori --user=TNR_USER_01
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-session --session=GROUP_SESSION_02 --credential=fiori --user=TNR_USER_02
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-session --session=GROUP_SESSION_03 --credential=fiori --user=TNR_USER_0
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-session --session=GROUP_SESSION_01 --credential=supplier --user=TNR_TECH_USER
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-session --session=GROUP_SESSION_02 --credential=supplier --user=TNR_TECH_USER
./UserCatalogueManager.js --dir='S:/TC_DATA/Technical/' --set-session --session=GROUP_SESSION_03 --credential=supplier --user=TNR_TECH_USER
````






## Detailed Documentation

* ``setLockFolderLocation``
* ``setUserCatalogueLocation``
* ``catalogue``
    * ``session``
        * ``add``
        * ``delete``
        * ``rename``
        * ``credential``
            * ``user``
                * ``set``
                * ``setPassword``
    * ``credential``
        * ``add``
        * ``delete``
        * ``rename``
        * ``user``
            * ``setPassword``
    * ``save``
* ``hasError``
* ``<dynamic>`` :
    * ``user``
    * ``password``
    * ``signed``
        * ``on``
        * ``off``
    * ``isSigned``
    * ``<dynamic>``
* ``initializeCatalogue``
* ``getUserSessionGroup``
* ``releaseUserSessionGroup``

