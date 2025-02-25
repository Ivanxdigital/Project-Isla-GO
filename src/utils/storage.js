import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export const uploadDriverDocument = async (file, userId, documentType) => {
  try {
    if (!file) throw new Error('No file provided');

    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${documentType}-${uuidv4()}.${fileExt}`;
    const filePath = `driver-documents/${fileName}`;

    // Upload the file
    const { error: uploadError, data } = await supabase.storage
      .from('driver-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: publicUrl,
      name: file.name,
      type: file.type,
      size: file.size
    };
  } catch (error) {
    console.error('Error uploading document:', error.message);
    throw new Error(`Failed to upload document: ${error.message}`);
  }
};

export const deleteDriverDocument = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('driver-documents')
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting document:', error.message);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
};
