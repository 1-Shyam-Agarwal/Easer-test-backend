const cloudinary = require('cloudinary').v2;

exports.uploadMediaToCloudinary = async (file, folder, quality) => {
    try {
        const options = { folder: folder || 'default-folder' };
        if (quality) {
            options.quality = quality;
        }
        options.resource_type = 'auto';

        if (!file || !file.tempFilePath) {
            throw new Error('Invalid file or temporary file path.');
        }

        // Upload to Cloudinary
        return await cloudinary.uploader.upload(file.tempFilePath, options);
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new Error('Failed to upload media to Cloudinary.');
    }
};

exports.imageUpload = async (file) => {
    try {
        const uploadedFile = await cloudinary.uploader.upload(
            file.tempFilePath,
            {
                public_id: 'uploaded_image',
            }
        );
    } catch (e) {
        console.log('ERROR OCCURED!!!');
        console.log(e.message);
    }
};
