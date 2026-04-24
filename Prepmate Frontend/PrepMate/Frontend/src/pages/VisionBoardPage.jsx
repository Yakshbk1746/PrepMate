import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { createVisionImage, deleteVisionImage, getVisionImages } from '../services/api';

const VisionBoardPage = () => {
  const { backendUserId } = useAuth();
  const [images, setImages] = useState([]);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!backendUserId) return;
    getVisionImages(backendUserId).then(setImages).catch(console.error);
  }, [backendUserId]);

  const addImage = async (e) => {
    e.preventDefault();
    if (!backendUserId || !url.trim()) return;

    try {
      const saved = await createVisionImage(backendUserId, {
        imageUrl: url.trim(),
        title: label.trim() || 'Vision',
      });
      setImages((prev) => [saved, ...prev]);
      setUrl('');
      setLabel('');
    } catch (error) {
      console.error(error);
    }
  };

  const removeImage = async (id) => {
    try {
      await deleteVisionImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <ImageIcon size={16} className="text-pink-500" /> Vision Board
          </h2>

          <form onSubmit={addImage} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Image URL"
              required
              className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm"
            />
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm"
            />
            <button type="submit" className="md:col-span-3 px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              <Plus size={14} /> Add Image
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {images.length === 0 && <p className="text-xs text-slate-500">No images yet.</p>}
            {images.map((img) => (
              <div key={img.id} className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
                <img src={img.imageUrl || img.url} alt={img.title || 'Vision'} className="w-full h-40 object-cover" />
                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{img.title || img.label || 'Vision'}</span>
                  <button onClick={() => removeImage(img.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisionBoardPage;
