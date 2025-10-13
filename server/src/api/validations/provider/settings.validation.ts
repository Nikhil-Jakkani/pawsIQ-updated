import Joi from 'joi';

export const providerSettingsValidation = {
  generatePhotoUpload: {
    body: Joi.object().keys({
      fileName: Joi.string().required().max(255),
      variant: Joi.string().valid('profile', 'cover', 'gallery').optional(),
    }),
  },

  generateDocumentUpload: {
    body: Joi.object().keys({
      fileName: Joi.string().required().max(255),
      documentType: Joi.string().required().max(100),
    }),
  },

  saveDocument: {
    body: Joi.object().keys({
      documentType: Joi.string().required().max(100),
      storagePath: Joi.string().required().max(500),
    }),
  },

  deleteDocument: {
    params: Joi.object().keys({
      documentId: Joi.number().integer().required(),
    }),
  },

  updatePassword: {
    body: Joi.object().keys({
      currentPassword: Joi.string().required().min(6),
      newPassword: Joi.string().required().min(6).max(128),
    }),
  },

  updateProfile: {
    body: Joi.object()
      .keys({
        // Basic info
        serv_provider_name: Joi.string().min(2).max(120),
        provider_name: Joi.string().min(2).max(120),
        name: Joi.string().min(2).max(120),
        
        serv_provider_contact_nbr: Joi.string().min(5).max(30),
        provider_contact_number: Joi.string().min(5).max(30),
        phone: Joi.string().min(5).max(30),
        
        serv_provider_desc: Joi.string().max(1000).allow('', null),
        provider_desc: Joi.string().max(1000).allow('', null),
        description: Joi.string().max(1000).allow('', null),
        
        serv_provider_exp_years: Joi.alternatives(Joi.string(), Joi.number()).allow('', null),
        provider_experience_years: Joi.alternatives(Joi.string(), Joi.number()).allow('', null),
        experience_years: Joi.alternatives(Joi.string(), Joi.number()).allow('', null),
        experience: Joi.alternatives(Joi.string(), Joi.number()).allow('', null),
        
        serv_provider_certificates: Joi.string().max(1000).allow('', null),
        provider_certificates: Joi.string().max(1000).allow('', null),
        certificates: Joi.string().max(1000).allow('', null),
        
        serv_provider_insta_acct_dtls: Joi.string().max(255).allow('', null),
        provider_insta: Joi.string().max(255).allow('', null),
        instagram: Joi.string().max(255).allow('', null),
        
        serv_provider_fb_acct_dtls: Joi.string().max(255).allow('', null),
        provider_fb: Joi.string().max(255).allow('', null),
        facebook: Joi.string().max(255).allow('', null),
        
        serv_provider_location: Joi.string().max(255).allow('', null),
        provider_location: Joi.string().max(255).allow('', null),
        location: Joi.string().max(255).allow('', null),

        // Photo URLs
        profile_photo_url: Joi.alternatives(
          Joi.string().max(500).allow('', null),
          Joi.object().keys({
            path: Joi.string(),
            storagePath: Joi.string(),
            url: Joi.string(),
          })
        ).allow(null),
        profilePhotoUrl: Joi.alternatives(
          Joi.string().max(500).allow('', null),
          Joi.object()
        ).allow(null),
        
        cover_photo_url: Joi.alternatives(
          Joi.string().max(500).allow('', null),
          Joi.object().keys({
            path: Joi.string(),
            storagePath: Joi.string(),
            url: Joi.string(),
          })
        ).allow(null),
        coverPhotoUrl: Joi.alternatives(
          Joi.string().max(500).allow('', null),
          Joi.object()
        ).allow(null),

        // Clinic info
        clinic_name: Joi.string().max(150).allow('', null),
        clinicName: Joi.string().max(150).allow('', null),
        
        clinic_phone: Joi.string().max(30).allow('', null),
        clinicPhone: Joi.string().max(30).allow('', null),
        
        clinic_website: Joi.string().max(255).allow('', null),
        clinicWebsite: Joi.string().max(255).allow('', null),
        website: Joi.string().max(255).allow('', null),
        
        clinic_hours: Joi.alternatives(
          Joi.string().max(500).allow('', null),
          Joi.object()
        ).allow(null),
        clinicHours: Joi.alternatives(
          Joi.string().max(500).allow('', null),
          Joi.object()
        ).allow(null),

        // Clinic address
        clinic_address_line1: Joi.string().max(255).allow('', null),
        clinicAddressLine1: Joi.string().max(255).allow('', null),
        
        clinic_address_line2: Joi.string().max(255).allow('', null),
        clinicAddressLine2: Joi.string().max(255).allow('', null),
        
        clinic_city: Joi.string().max(100).allow('', null),
        clinicCity: Joi.string().max(100).allow('', null),
        
        clinic_state: Joi.string().max(100).allow('', null),
        clinicState: Joi.string().max(100).allow('', null),
        
        clinic_postal_code: Joi.string().max(30).allow('', null),
        clinicPostalCode: Joi.string().max(30).allow('', null),
        clinic_zip: Joi.string().max(30).allow('', null),
        clinicZip: Joi.string().max(30).allow('', null),
        
        clinic_country: Joi.string().max(100).allow('', null),
        clinicCountry: Joi.string().max(100).allow('', null),

        // Specializations & languages
        specializations: Joi.alternatives(
          Joi.string().max(500).allow('', null),
          Joi.array().items(Joi.string())
        ).allow(null),
        specialization: Joi.alternatives(
          Joi.string().max(500).allow('', null),
          Joi.array().items(Joi.string())
        ).allow(null),
        
        languages_spoken: Joi.alternatives(
          Joi.string().max(500).allow('', null),
          Joi.array().items(Joi.string())
        ).allow(null),
        languagesSpoken: Joi.alternatives(
          Joi.string().max(500).allow('', null),
          Joi.array().items(Joi.string())
        ).allow(null),
        languages: Joi.alternatives(
          Joi.string().max(500).allow('', null),
          Joi.array().items(Joi.string())
        ).allow(null),

        // Billing info (nested object)
        billing: Joi.object().keys({
          payout_method: Joi.string().max(50).allow('', null),
          payoutMethod: Joi.string().max(50).allow('', null),
          
          account_holder_name: Joi.string().max(150).allow('', null),
          accountHolderName: Joi.string().max(150).allow('', null),
          
          account_number: Joi.string().max(50).allow('', null),
          accountNumber: Joi.string().max(50).allow('', null),
          
          bank_name: Joi.string().max(100).allow('', null),
          bankName: Joi.string().max(100).allow('', null),
          
          bank_branch: Joi.string().max(100).allow('', null),
          bankBranch: Joi.string().max(100).allow('', null),
          
          ifsc_code: Joi.string().max(20).allow('', null),
          ifscCode: Joi.string().max(20).allow('', null),
          
          upi_id: Joi.string().max(100).allow('', null),
          upiId: Joi.string().max(100).allow('', null),
          
          pan_number: Joi.string().max(20).allow('', null),
          panNumber: Joi.string().max(20).allow('', null),
          
          gst_number: Joi.string().max(20).allow('', null),
          gstNumber: Joi.string().max(20).allow('', null),
          
          tax_status: Joi.string().max(50).allow('', null),
          taxStatus: Joi.string().max(50).allow('', null),
          
          payout_frequency: Joi.string().max(30).allow('', null),
          payoutFrequency: Joi.string().max(30).allow('', null),
          
          billing_address_line1: Joi.string().max(255).allow('', null),
          billingAddressLine1: Joi.string().max(255).allow('', null),
          
          billing_address_line2: Joi.string().max(255).allow('', null),
          billingAddressLine2: Joi.string().max(255).allow('', null),
          
          billing_city: Joi.string().max(100).allow('', null),
          billingCity: Joi.string().max(100).allow('', null),
          
          billing_state: Joi.string().max(100).allow('', null),
          billingState: Joi.string().max(100).allow('', null),
          
          billing_postal_code: Joi.string().max(30).allow('', null),
          billingPostalCode: Joi.string().max(30).allow('', null),
          billing_zip: Joi.string().max(30).allow('', null),
          billingZip: Joi.string().max(30).allow('', null),
          
          billing_country: Joi.string().max(100).allow('', null),
          billingCountry: Joi.string().max(100).allow('', null),
          
          notes: Joi.string().max(500).allow('', null),
          billing_notes: Joi.string().max(500).allow('', null),
          billingNotes: Joi.string().max(500).allow('', null),
        }).optional(),
      })
      .min(1),
  },
};
