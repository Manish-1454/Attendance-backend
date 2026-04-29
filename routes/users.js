const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const path=require('path')
const multer=require('multer')
const cloudinary=require('../config/cloudinary')

const storage = multer.memoryStorage();

const upload = multer({ storage });

router.post('/add', upload.single('image'), async (req, res) => {
  try {
    const { name, password, gender, phonenumber, salaryPerDay,role } = req.body;

    let imageUrl = "";

    if (req.file) {
      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "workers_profile" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          stream.end(buffer);
        });
      };

      const result = await streamUpload(req.file.buffer);
      imageUrl = result.secure_url;
    }

    // ✅ Create NEW user
    const newUser = new User({
      name,
      password,
      gender,
      phonenumber,
      salaryPerDay,
      image: imageUrl,
      role,
    });

    await newUser.save();
    console.log("FILE:", req.file);
 console.log("BODY:", req.body);

    res.json({ message: "User created", user: newUser });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
router.post('/update/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, phonenumber, salaryPerDay } = req.body;
 

     let imageUrl = "";

    if (req.file) {
      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "workers_profile" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          stream.end(buffer);
        });
      };

      const result = await streamUpload(req.file.buffer);
      imageUrl = result.secure_url;
    }
       const updateData = {
      name,
      phonenumber,
      salaryPerDay,
      image:imageUrl,
    };
    const updated = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ message: 'Updated', updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET all users - admin only
router.get('/admin/dashboard', auth, role(['admin','manager']), async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// GET own profile - user
router.get('/me', auth, role(['worker']), async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
});

router.get('/detail/:id',auth,async(req,res)=>{
  const detail=await User.findById(req.params.id);
  res.json(detail);
})

module.exports = router;
