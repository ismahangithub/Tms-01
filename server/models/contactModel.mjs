// src/models/contactModel.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const ContactSchema = new Schema({
  contactType: {
    type: String,
    enum: ['internal', 'external'],
    required: true,
  },
  // Fields for internal contacts
  fullName: {
    type: String,
    required: function () {
      return this.contactType === 'internal';
    },
  },
  email: {
    type: String,
    required: function () {
      return this.contactType === 'internal';
    },
  },
  address: {
    type: String,
    required: function () {
      return this.contactType === 'internal';
    },
  },
  phone: {
    type: String,
    required: function () {
      return this.contactType === 'internal';
    },
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: function () {
      return this.contactType === 'internal';
    },
  },
  // Fields for external contacts
  company: {
    type: String,
    required: function () {
      return this.contactType === 'external';
    },
  },
  contactPerson: {
    type: String,
    required: function () {
      return this.contactType === 'external';
    },
  },
  externalEmail: {
    type: String,
    required: function () {
      return this.contactType === 'external';
    },
  },
  externalPhone: {
    type: String,
    required: function () {
      return this.contactType === 'external';
    },
  },
  externalAddress: {
    type: String,
    required: function () {
      return this.contactType === 'external';
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default model('Contact', ContactSchema);
