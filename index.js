function main() {

    //Default settings - Extracts highlights and bold items
    const highlightsRegEx = '(==[^=]+==)';
    const boldRegEx = '(\\*\\*[^\\*]+\\*\\*)';

    //CHANGE THIS WHEN ADDING NEW SETTINGS
    const settingsVersion = 'v1';

    //Use only for saving these first time in the plugin settings file
    let defaultSettings = {
        expr: `${highlightsRegEx}|${boldRegEx}`,
        summaryTitle: 'Summary',
        keepRefs: true,             //Keeps a reference to the source block in this format [*](((uuid)))
        nested: true,                //Extract from current block and all the child blocks
        keepMeta: false,              //Remove highlights and bold
        settingsVersion: settingsVersion
    };

    //Load plugin settings
    let pluginSettings = logseq.settings;

    //This is to ensure that in future if new settings are added they are written over to settings file.
    //This will overwrite user's existing settings though.
    const shouldUpdateSettings = pluginSettings.settingsVersion != defaultSettings.settingsVersion;

    //If first time, then save default settings
    if (shouldUpdateSettings) {

        pluginSettings = defaultSettings;
        logseq.updateSettings(pluginSettings);
    }


    //Extraction function which registers Extract as a context menu for a block
    logseq.Editor.registerBlockContextMenuItem(
        'Extract',
        async (currentBlock) => {

            //Get current block content
            const { content } = await logseq.Editor.getBlock(currentBlock.uuid);
            const regEx = new RegExp(pluginSettings.expr, 'g');

            //Get all extracts that match regex
            const extracts = [...content.matchAll(regEx)];

            //Create a summary block below the current block (sibling) - you can change content of this block 
            //from Summary to something else by changing the summaryTitle property in settings
            var summaryBlock = await logseq.Editor.insertBlock(currentBlock.uuid, pluginSettings.summaryTitle, { sibling: true });

            //Create the extracts as children blocks of summary block
            extracts.forEach((i) => {

                let content = i[0];

                //Remove == or ** from start and end if keepMeta is false
                content = pluginSettings.keepMeta ? content : content.slice(2, -2);

                //Keep reference of source block
                content = pluginSettings.keepRefs ? `${content} [*](((${currentBlock.uuid})))` : content;

                logseq.Editor.insertBlock(summaryBlock.uuid, content, { sibling: false });
            });
        }
    );
}

// bootstrap
logseq.ready(main).catch(console.error)