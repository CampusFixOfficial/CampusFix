const mongoose = require('mongoose');

const campusSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'location-catalogue' },
  hostelLocations: { type: [mongoose.Schema.Types.Mixed], default: [] },
  messLocations: { type: [mongoose.Schema.Types.Mixed], default: [] },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('CampusSettings', campusSettingsSchema);
