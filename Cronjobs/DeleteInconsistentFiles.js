const cron = require('node-cron');
const mails = require('../models/Mails.js');
const bucket = require('../utils/Firebase/firebase.js');

// Schedule a task to run every minute
const deleteInconsistentFiles = cron.schedule('0 0 4 * * *', async () => {
    //Fetching all file_ref from the mail collection
    const mailCollectionResponse = await mails.find().select('-_id documents');

    let filesInUseRef = [];

    console.log('Cronjob started :', new Date().toLocaleString());
    const n = mailCollectionResponse.length;
    for (let i = 0; i < n; i++) {
        let mailContent = mailCollectionResponse[i]?.documents.map((file) => {
            return file.fileRef;
        });
        filesInUseRef = [...filesInUseRef, ...mailContent];
    }

    const [files] = await bucket.getFiles({ prefix: 'documents/' });

    const fileRefsFirebase = files.map((file) => file.name); // file.name is like fileRef

    // Step 1: Remove duplicates
    const fileRefsFirebaseSet = new Set(fileRefsFirebase);
    const filesInUseRefSet = new Set(filesInUseRef);

    // Step 2: Remove elements from set1 that are in set2
    const inconsistentFiles = [...fileRefsFirebaseSet].filter(
        (item) => !filesInUseRefSet.has(item)
    );

    inconsistentFiles.forEach(async (fileRef) => {
        await bucket.file(fileRef).delete();
    });

    console.log('Inconsistent files deleted successfully.');
    console.log('Cronjob ended :', new Date().toLocaleString());
});

module.exports = { deleteInconsistentFiles };
