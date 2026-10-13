const { connect } = require('getstream');
const bcrypt = require('bcrypt');
const StreamChat = require('stream-chat').StreamChat;
const crypto = require('crypto');

require('dotenv').config();

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_API_SECRET;
const app_id = process.env.STREAM_APP_ID;

const getAvatarURL = (req, file) => (
    `${req.protocol}://${req.get('host')}/uploads/avatars/${file.filename}`
);

const signup = async (req, res) => {
    try {
        const { fullName, userName, password, phoneNumber } = req.body;

        if (typeof password !== 'string' || !password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const avatarURL = req.file ? getAvatarURL(req, req.file) : undefined;
        console.log('AVATAR URL: ',avatarURL);
        const userId = crypto.randomBytes(16).toString('hex');

        const serverClient = connect(api_key, api_secret, app_id);

        const hashedPassword = await bcrypt.hash(password, 10);

        const token = serverClient.createUserToken(userId);


        res.status(200).json({token, fullName, userName, userId, hashedPassword, phoneNumber, avatarURL })
    } catch (error) {
        console.log(error);

        res.status(500).json({message: error})
    }
};
const login = async (req, res) => {
    try {
        const { userName, password } = req.body;

        if (typeof password !== 'string' || !password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const serverClient = connect(api_key, api_secret, app_id);
        const client = StreamChat.getInstance(api_key, api_secret);

        const { users } = await client.queryUsers({name: userName});

        if(!users.length) return res.status(400).json({ message: 'User not found'});

        const success = await bcrypt.compare(password, users[0].hashedPassword);

        const token = serverClient.createUserToken(users[0].id)

        if(success){
            res.status(200).json({ token, fullName: users[0].fullName, userName, userId: users[0].id});
        }else{
            res.status(500).json({ message: 'Incorrect Password'});
        }
    } catch (error) {
        console.log(error);

        res.status(500).json({message: error})
    }

};

const updateProfilePicture = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Profile picture is required' });
        }

        const avatarURL = getAvatarURL(req, req.file);

        const client = StreamChat.getInstance(api_key, api_secret);
        await client.partialUpdateUser({
            id: req.user.id,
            set: { image: avatarURL },
        });

        return res.status(200).json({ avatarURL });
    } catch (error) {
        console.error('Profile picture update failed:', error);
        return res.status(500).json({ message: 'Could not update profile picture' });
    }
};

module.exports = {signup, login, updateProfilePicture}