function main() {

    //Default settings - Extracts highlights and bold items
    const highlightsRegEx = '(==[^=]+==)';
    const boldRegEx = '(\\*\\*[^\\*]+\\*\\*)';

    let settings = {
        expr: `${highlightsRegEx}|${boldRegEx}`,
        summaryTitle: 'Summary'
    };

    //Save in settings
    logseq.updateSettings(settings);

    //Extraction function which registers Extract as a context menu for a block
    logseq.Editor.registerBlockContextMenuItem(
        'Extract',
        async (currentBlock) => {

            //Get current block content
            const { content } = await logseq.Editor.getBlock(currentBlock.uuid);
            const regEx = new RegExp(settings.expr, 'g');

            //Get all extracts that match regex
            const extracts = [...content.matchAll(regEx)];

            //Create a summary block below the current block (sibling) - you can change content of this block 
            //from Summary to something else by changing the summaryTitle property in settings
            var summaryBlock = await logseq.Editor.insertBlock(currentBlock.uuid, settings.summaryTitle, { sibling: true });

            //Create the extracts as children blocks of summary block
            extracts.forEach((i) => {

                logseq.Editor.insertBlock(summaryBlock.uuid, i[0], { sibling: false });

            });
        }
    );
}

// bootstrap
logseq.ready(main).catch(console.error)