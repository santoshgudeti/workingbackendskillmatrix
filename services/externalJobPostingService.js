const axios = require('axios');
const FormData = require('form-data');
const mongoose = require('mongoose');

/**
 * Service to handle automatic job posting to external system
 */

// Function to extract job details from JD using external API
async function extractJobDetailsFromJD(jobDescriptionBuffer, filename) {
  try {
    console.log('📤 Extracting job details from JD using external API...');
    
    const formData = new FormData();
    formData.append('job_description', jobDescriptionBuffer, {
      filename: filename,
      contentType: 'application/pdf'
    });

    const response = await axios.post(
      'https://skillmatrix.docapture.com/extract-jd-new',
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 30000 // 30 second timeout
      }
    );

    if (response.data.success) {
      console.log('✅ Job details extracted successfully');
      console.log('📋 Extracted job details:', JSON.stringify(response.data.data, null, 2));
      return response.data.data;
    } else {
      throw new Error('Failed to extract job details from JD');
    }
  } catch (error) {
    console.error('❌ Error extracting job details:', error.message);
    throw error;
  }
}

// Function to check if user exists as job poster
async function validateJobPoster(userEmail) {
  try {
    console.log(`🔍 Validating if user ${userEmail} exists as job poster...`);
    
    // Access models from mongoose (they're already defined in server.js)
    const JobPoster = mongoose.model('JobPoster');
    
    // Check if the user exists in the job poster collection
    const jobPoster = await JobPoster.findOne({ email: userEmail });
    
    console.log(`📊 Job poster search result for ${userEmail}:`, jobPoster ? 'Found' : 'Not found');
    
    if (jobPoster) {
      console.log(`✅ User ${userEmail} is a valid job poster`);
      console.log(`📋 Job poster details: ID=${jobPoster._id}, Name=${jobPoster.name}`);
      return { isValid: true, jobPoster };
    } else {
      // Let's also check if there are any job posters in the database to help with debugging
      const allJobPosters = await JobPoster.find({}, 'email name');
      console.log(`📋 All job posters in database:`, allJobPosters.map(p => `${p.email} (${p.name})`));
      console.log(`❌ User ${userEmail} is not registered as a job poster`);
      return { isValid: false, jobPoster: null };
    }
  } catch (error) {
    console.error('❌ Error validating job poster:', error.message);
    console.error('📋 Error stack:', error.stack);
    return { isValid: false, jobPoster: null };
  }
}

// Function to create job post in external system
async function createExternalJobPost(jobDetails, jobPoster) {
  try {
    console.log('📤 Creating job post in external system...');
    console.log('📋 Job details to be posted:', JSON.stringify(jobDetails, null, 2));
    console.log('📋 Job poster details:', JSON.stringify({
      id: jobPoster._id,
      email: jobPoster.email,
      name: jobPoster.name
    }, null, 2));
    
    // Access models from mongoose (they're already defined in server.js)
    const JobPost = mongoose.model('JobPost');
    
    // Prepare job post data - properly mapping fields from extracted data
    const jobPostData = {
      title: jobDetails.title || 'Untitled Position',
      companyName: jobDetails.companyName || jobPoster.companyName || 'Unknown Company',
      location: jobDetails.location || '',
      jobType: jobDetails.type || 'Full-Time', // Mapping "type" to "jobType"
      experience: jobDetails.experience || '',
      department: jobDetails.department || '',
      skillsRequired: jobDetails.skills ? jobDetails.skills.split(',').map(skill => skill.trim()) : [], // Convert comma-separated string to array
      salaryRange: jobDetails.salary || 'Negotiable',
      descriptionText: jobDetails.description || '',
      postedBy: jobPoster._id
    };

    console.log('📋 Prepared job post data:', JSON.stringify(jobPostData, null, 2));

    // Create job post in our system first
    const jobPost = new JobPost(jobPostData);
    await jobPost.save();
    
    console.log(`✅ Job post saved to database with ID: ${jobPost._id}`);
    
    // Generate public URL for the job post
    const publicId = jobPost._id.toString();
    jobPost.publicId = publicId;
    await jobPost.save();
    
    const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobs/${publicId}`;
    
    console.log(`✅ Job post created successfully with public URL: ${publicUrl}`);
    return { success: true, jobPost, publicUrl };
  } catch (error) {
    console.error('❌ Error creating external job post:', error.message);
    console.error('📋 Error stack:', error.stack);
    throw error;
  }
}

// Main function to handle automatic job posting
async function handleAutomaticJobPosting(jobDescriptionBuffer, filename, userEmail) {
  try {
    console.log(`🚀 Starting automatic job posting process for user: ${userEmail}`);
    console.log(`📋 File details: ${filename}, Size: ${jobDescriptionBuffer.length} bytes`);
    
    // Step 1: Validate if user is a job poster
    const validation = await validateJobPoster(userEmail);
    if (!validation.isValid) {
      console.log('⚠️  User is not a job poster. Skipping automatic job posting.');
      return { 
        success: false, 
        reason: 'User is not registered as a job poster',
        jobPost: null,
        publicUrl: null
      };
    }
    
    // Step 2: Extract job details from JD
    console.log('🔍 Proceeding to extract job details...');
    const jobDetails = await extractJobDetailsFromJD(jobDescriptionBuffer, filename);
    
    // Step 3: Create job post in external system
    console.log('🔍 Proceeding to create job post...');
    const result = await createExternalJobPost(jobDetails, validation.jobPoster);
    
    console.log('🎉 Automatic job posting process completed successfully');
    return {
      success: true,
      jobPost: result.jobPost,
      publicUrl: result.publicUrl
    };
  } catch (error) {
    console.error('❌ Automatic job posting failed:', error.message);
    console.error('📋 Error stack:', error.stack);
    return {
      success: false,
      error: error.message,
      jobPost: null,
      publicUrl: null
    };
  }
}

module.exports = {
  handleAutomaticJobPosting,
  extractJobDetailsFromJD,
  validateJobPoster,
  createExternalJobPost
};