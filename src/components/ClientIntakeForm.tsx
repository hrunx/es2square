// Previous imports remain the same...

const handleFileUpload = (type: 'bills' | 'plan') => async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files || !buildingId) return;

  try {
    if (type === 'bills') {
      setFormData({ ...formData, electricityBills: Array.from(files) });
      
      // Process each bill with OCR and store results
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audit-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('audit-files')
          .getPublicUrl(fileName);

        // Create audit file record
        const { data: auditFile, error: auditError } = await supabase
          .from('audit_files')
          .insert({
            file_url: publicUrl,
            file_name: file.name,
            file_type: file.type,
            building_id: buildingId,
            processing_status: 'pending'
          })
          .select()
          .single();

        if (auditError) throw auditError;

        // Process with OCR and DeepSeek
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-analyze`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileUrl: publicUrl,
            type: 'bill'
          })
        });

        if (!response.ok) throw new Error('Failed to analyze bill');

        const analysisResult = await response.json();

        // Store analysis results
        await supabase
          .from('ocr_data')
          .insert({
            file_id: auditFile.id,
            raw_text: analysisResult.raw_text,
            processed_text: analysisResult.analysis,
            metadata: {
              type: 'bill',
              analyzed_at: new Date().toISOString()
            }
          });
      }
    } else {
      const file = files[0];
      setFormData({ ...formData, floorPlan: file });

      // Process floor plan
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audit-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audit-files')
        .getPublicUrl(fileName);

      // Create audit file record
      const { data: auditFile, error: auditError } = await supabase
        .from('audit_files')
        .insert({
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
          building_id: buildingId,
          processing_status: 'pending'
        })
        .select()
        .single();

      if (auditError) throw auditError;

      // Process with OCR and DeepSeek
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileUrl: publicUrl,
          type: 'floorplan'
        })
      });

      if (!response.ok) throw new Error('Failed to analyze floor plan');

      const analysisResult = await response.json();

      // Store analysis results
      await supabase
        .from('ocr_data')
        .insert({
          file_id: auditFile.id,
          raw_text: analysisResult.raw_text,
          processed_text: analysisResult.analysis,
          metadata: {
            type: 'floorplan',
            analyzed_at: new Date().toISOString()
          }
        });

      // If rooms were detected, store them
      if (analysisResult.analysis?.rooms?.length > 0) {
        const roomInserts = analysisResult.analysis.rooms.map((room: any) => ({
          building_id: buildingId,
          name: room.name,
          area: room.area,
          room_data: {
            dimensions: room.dimensions,
            extracted_from_ocr: true
          }
        }));

        await supabase.from('rooms').insert(roomInserts);
      }
    }
  } catch (error) {
    console.error(`Error processing ${type}:`, error);
    // Handle error appropriately
  }
};

// Rest of the component remains the same...