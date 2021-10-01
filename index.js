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
            const block = await logseq.Editor.getBlock(currentBlock.uuid, { includeChildren: pluginSettings.nested });
            const regEx = new RegExp(pluginSettings.expr, 'g');

            //Get all extracts that match regex
            //const extracts = [...block.content.matchAll(regEx)];
            let extracts = [];
            getExtracts(block, regEx, extracts);

            //EXIT if no extracts found
            if (!extracts || !extracts.length) {

                logseq.App.showMsg('❗ Nothing to extract!');
                return;
            }

            //Create a summary block below the current block (sibling) - you can change content of this block 
            //from Summary to something else by changing the summaryTitle property in settings
            var summaryBlock = await logseq.Editor.insertBlock(currentBlock.uuid, pluginSettings.summaryTitle, { sibling: true });

            //Create the extracts as children blocks of summary block
            extracts.forEach((i) => {

                let content = i.content;

                //Remove == or ** from start and end if keepMeta is false
                content = pluginSettings.keepMeta ? content : content.slice(2, -2);

                //Keep reference of source block
                content = pluginSettings.keepRefs ? `${content} [*](((${i.source.uuid})))` : content;

                logseq.Editor.insertBlock(summaryBlock.uuid, content, { sibling: false });
            });

            logseq.App.showMsg('✔️ Extraction completed successfully!');
        }
    );
}

function getExtracts(currentBlock, regEx, extracts) {

    //Get children of the current block
    let children = currentBlock.children;

    //Find the extracts from the current block
    let currentBlockExtracts = [...currentBlock.content.matchAll(regEx)];

    //Create a map from current block's extracts
    let currentBlockExtractsWithBlockRef = currentBlockExtracts.map((e) => { return { content: e[0], source: currentBlock }; });

    //Push the extracts map from current block into main extracts array
    !!currentBlockExtracts.length && extracts.push(...currentBlockExtractsWithBlockRef);

    //If there are children then call this method recursively (filling the main extracts array which is passed as argument)
    !!children.length && children.forEach((c) => getExtracts(c, regEx, extracts));
    return;
}

// bootstrap
logseq.ready(main).catch(console.error)