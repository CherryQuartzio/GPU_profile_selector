import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import GObject from 'gi://GObject';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

import * as Utility from '../lib/Utility.js';


export const AttachedToBatteryToggle = GObject.registerClass(
class AttachedToBatteryToggle extends QuickSettings.QuickMenuToggle {
    _init(extensionObject) {
        const currentProfile = Utility.getCurrentProfile();
        super._init({
            title: 'GPU Profile',
            subtitle: currentProfile === Utility.GPU_PROFILE_UNKNOWN
                ? 'Unknown'
                : Utility.capitalizeFirstLetter(currentProfile),
            iconName: 'power-profile-performance-symbolic',
            toggleMode: false, // disable the possibility to click the button
            checked: currentProfile === 'hybrid' || currentProfile === 'nvidia',
        });
        this.all_settings = extensionObject.getSettings();

        const headerTitle = currentProfile === Utility.GPU_PROFILE_UNKNOWN
            ? 'Select GPU Profile'
            : Utility.capitalizeFirstLetter(currentProfile);

        // This function is unique to this class. It adds a nice header with an icon, title and optional subtitle.
        this.menu.setHeader('power-profile-performance-symbolic', headerTitle, 'Choose a GPU mode');

        // add a sections of items to the menu
        this._itemsSection = new PopupMenu.PopupMenuSection();
        this._itemsSection.addAction('Integrated', () => {
            if (currentProfile !== 'integrated') {
                Utility.switchIntegrated();
                super.subtitle = 'Integrated';
                this.menu.setHeader('power-profile-performance-symbolic', headerTitle + ' → Integrated', 'Restart to apply');
            }
        });
        this._itemsSection.addAction('Hybrid', () => {
            if (currentProfile !== 'hybrid') {
                Utility.switchHybrid(this.all_settings);
                super.subtitle = 'Hybrid';
                this.menu.setHeader('power-profile-performance-symbolic', headerTitle + ' → Hybrid', 'Restart to apply');
            }
        });
        this._itemsSection.addAction('Nvidia', () => {
            if (currentProfile !== 'nvidia') {
                Utility.switchNvidia(this.all_settings);
                super.subtitle = 'Nvidia';
                this.menu.setHeader('power-profile-performance-symbolic', headerTitle + ' → Nvidia', 'Restart to apply');
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
