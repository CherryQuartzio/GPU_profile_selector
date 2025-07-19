import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import GObject from 'gi://GObject';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

import * as Utility from '../lib/Utility.js';

export const AttachedToBatteryToggle = GObject.registerClass(
class AttachedToBatteryToggle extends QuickSettings.QuickMenuToggle {  
    _init(extensionObject) {
        this.activeProfile = Utility.getCurrentProfile(); // active profile since startup
        this.requestedProfile = null;
        this.chosenProfile = this.activeProfile === Utility.GPU_PROFILE_UNKNOWN // currently selected profile
                ? 'unknown'
                : this.activeProfile;
        this.restartPending = false;
        
        super._init({
            title: 'GPU Profile',
            subtitle: Utility.capitalizeFirstLetter(this.chosenProfile),
            iconName: 'power-profile-performance-symbolic',
            toggleMode: false, // disable the possibility to click the button
            checked: this.activeProfile === 'hybrid' || this.activeProfile === 'nvidia',
        });
        this.all_settings = extensionObject.getSettings();

        // This function is unique to this class. It adds a nice header with an icon, title and optional subtitle.
        this.menu.setHeader('power-profile-performance-symbolic', super.title, 'Choose a GPU mode');

        // add a sections of items to the menu
        this._itemsSection = new PopupMenu.PopupMenuSection();
        this._itemsSection.addAction('Integrated' + (this.activeProfile === 'integrated' ? ' (Active)' : ''), () => {
            if (this.chosenProfile !== 'integrated' && this.requestedProfile === null) {
                this.requestedProfile = 'integrated';
                super.subtitle = 'Switching...';
                this.menu.setHeader('power-profile-performance-symbolic', super.title, 'Switching to Integrated mode...');
                Utility.switchIntegrated(this._onSwitchComplete.bind(this));
            }
        });
        this._itemsSection.addAction('Hybrid' + (this.activeProfile === 'hybrid' ? ' (Active)' : ''), () => {
            if (this.chosenProfile !== 'hybrid' && this.requestedProfile === null) {
                this.requestedProfile = 'hybrid';
                super.subtitle = 'Switching...';
                this.menu.setHeader('power-profile-performance-symbolic', super.title, 'Switching to Hybrid mode...');
                Utility.switchHybrid(this.all_settings, this._onSwitchComplete.bind(this));
            }
        });
        this._itemsSection.addAction('Nvidia'+ (this.activeProfile === 'nvidia' ? ' (Active)' : ''), () => {
            if (this.chosenProfile !== 'nvidia' && this.requestedProfile === null) {
                this.requestedProfile = 'nvidia';
                super.subtitle = 'Switching...';
                this.menu.setHeader('power-profile-performance-symbolic', super.title, 'Switching to Nvidia mode...');
                Utility.switchNvidia(this.all_settings, this._onSwitchComplete.bind(this));
            }
        });
        this.menu.addMenuItem(this._itemsSection);

        // Add an entry-point for more settings
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        const settingsItem = this.menu.addAction(
            'More Settings',
            () => extensionObject.openPreferences()
        );

        // Ensure the settings are unavailable when the screen is locked
        settingsItem.visible = Main.sessionMode.allowSettings;
        this.menu._settingsActions[extensionObject.uuid] = settingsItem;
    }

    _onSwitchComplete() {
        this.chosenProfile = Utility.getCurrentProfile();
        if (!this.restartPending && (this.chosenProfile !== this.requestedProfile || this.activeProfile === this.requestedProfile)) {
            super.subtitle = Utility.capitalizeFirstLetter(this.chosenProfile);
            this.menu.setHeader('power-profile-performance-symbolic', super.title, 'Choose a GPU mode');
        }
        else {
            this.restartPending = true;
            super.subtitle = Utility.capitalizeFirstLetter(this.chosenProfile) + '*';
            this.menu.setHeader('power-profile-performance-symbolic', super.title, 
                'Restart to apply ' + Utility.capitalizeFirstLetter(this.chosenProfile) + ' mode');
            Utility.requestReboot();
        }
        
        // Deal with the visuals of aborting while in restart pending scenario

        this.requestedProfile = null;
    }
});

export const AttachedToBatteryView = GObject.registerClass(
class AttachedToBatteryView extends QuickSettings.SystemIndicator {
    _init(extensionObject) {
        super._init();
    }

    enable() {
        this._indicator = this._addIndicator();
        this._indicator.icon_name = 'power-profile-performance-symbolic' //Gio.icon_new_for_string(Me.dir.get_path() + Utility.ICON_SELECTOR_FILE_NAME);
        this._indicator.visible = false;
    }

    disable() {
        this.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
        super.destroy();
    }
});
