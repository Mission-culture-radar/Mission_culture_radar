type UploadProps = {
  jwt: string;
  activityId: number;
  files: File[];
};

export async function uploadActivityMedia({ jwt, activityId, files }: UploadProps) {
  if (!files.length) return;

  const uploads = files.map(async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("activity_id", String(activityId));

    const res = await fetch("https://ssfmhopnysidfqxdhgaa.supabase.co/functions/v1/uploadmedia-activities", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Upload failed:", errorText);
      throw new Error("Erreur pendant l'upload d'un fichier");
    }

    return await res.json();
  });

  return Promise.all(uploads);
}