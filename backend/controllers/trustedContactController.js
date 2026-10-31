import TrustedContact from '../models/TrustedContact.js';

// @desc    Get all trusted contacts for authenticated user
// @route   GET /api/trusted-contacts
// @access  Private
export const getTrustedContacts = async (req, res, next) => {
  try {
    const contacts = await TrustedContact.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new trusted contact
// @route   POST /api/trusted-contacts
// @access  Private
export const createTrustedContact = async (req, res, next) => {
  try {
    const { name, relation, phone, email, notifyOnSos, channels } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both contact name and phone number.',
      });
    }

    const contact = await TrustedContact.create({
      user: req.user._id,
      name: name.trim(),
      relation: relation?.trim() || 'Family / Emergency Contact',
      phone: phone.trim(),
      email: email?.trim() || '',
      notifyOnSos: notifyOnSos !== false,
      channels: channels || ['Simulated SMS'],
    });

    res.status(201).json({
      success: true,
      message: 'Trusted contact added successfully.',
      contact,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trusted contact
// @route   PUT /api/trusted-contacts/:id
// @access  Private
export const updateTrustedContact = async (req, res, next) => {
  try {
    const contact = await TrustedContact.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Trusted contact not found or unauthorized to edit.',
      });
    }

    Object.assign(contact, req.body);
    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Trusted contact updated successfully.',
      contact,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trusted contact
// @route   DELETE /api/trusted-contacts/:id
// @access  Private
export const deleteTrustedContact = async (req, res, next) => {
  try {
    const contact = await TrustedContact.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Trusted contact not found or unauthorized to delete.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Trusted contact deleted successfully.',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

