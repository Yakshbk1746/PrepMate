import React, { useState, useEffect } from 'react';
import { FolderOpen, FileText, Upload, Plus, Download, Trash2, Search, Filter, MoreVertical, Heart, FileIcon, ImageIcon, VideoIcon, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getResources, uploadResourceFile, getResourceOpenUrl, getResourceDownloadUrl, updateResource, deleteResource as deleteResourceApi } from '../services/api';

const Categories = ['All', 'Notes', 'Previous Year Papers', 'Syllabus', 'Reference Books', 'Assignments'];
const UploadCategories = ['Notes', 'Previous Year Papers', 'Syllabus', 'Reference Books', 'Assignments'];

const ResourcesPage = () => {
  const { backendUserId } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stagedFile, setStagedFile] = useState(null);
  const [uploadFormData, setUploadFormData] = useState({ name: '', category: 'Notes', sizeStr: '' });

  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!backendUserId) return;
    getResources(backendUserId).then(setFiles).catch(console.error);
  }, [backendUserId]);

  const toggleFavorite = (id) => {
    const file = files.find(f => f.id === id);
    if (!file) return;
    const current = !!file.favorite;
    updateResource(id, { favorite: !current })
      .then(updated => setFiles(prev => prev.map(r => r.id===id ? updated : r)))
      .catch(console.error);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    let sizeStr = '';
    if (file.size > 1024 * 1024) {
      sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
      sizeStr = Math.round(file.size / 1024) + ' KB';
    }

    setUploadFormData({
      name: file.name,
      category: activeCategory === 'All' ? 'Notes' : activeCategory,
      sizeStr: sizeStr
    });
    setStagedFile(file);
    e.target.value = '';
  };

  const confirmUpload = async (e) => {
    e.preventDefault();
    if (!backendUserId) {
      alert('User not synced yet. Please refresh and try again.');
      return;
    }

    if (!stagedFile || !uploadFormData.name.trim()) return;

    try {
      const saved = await uploadResourceFile(backendUserId, stagedFile, uploadFormData.category, uploadFormData.name.trim());
      setFiles(prev => [...prev, saved]);
      setStagedFile(null);
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || error?.response?.data || 'Upload failed. Please try again.';
      alert(typeof message === 'string' ? message : 'Upload failed. Please try again.');
    }
  };

  const hasStoredFile = (file) => Boolean(file?.storedFileName);

  const openFile = (file) => {
    if (!hasStoredFile(file)) {
      alert('This is a legacy entry without stored file data. Please re-upload this file.');
      return;
    }
    window.open(getResourceOpenUrl(file.id), '_blank', 'noopener,noreferrer');
  };

  const downloadFile = (file) => {
    if (!hasStoredFile(file)) {
      alert('This is a legacy entry without stored file data. Please re-upload this file.');
      return;
    }

    const link = document.createElement('a');
    link.href = getResourceDownloadUrl(file.id);
    link.download = file.name || 'resource';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteFile = (id) => {
    if(confirm('Are you sure you want to delete this file?')) {
      deleteResourceApi(id).then(() => setFiles(prev => prev.filter(r => r.id !== id))).catch(console.error);
    }
  };

  const getFileIcon = (type) => {
    switch(type) {
      case 'pdf': return <FileText className="text-red-500" size={24} />;
      case 'image': return <ImageIcon className="text-blue-500" size={24} />;
      case 'video': return <VideoIcon className="text-purple-500" size={24} />;
      case 'doc': return <FileText className="text-blue-600" size={24} />;
      default: return <FileIcon className="text-slate-500" size={24} />;
    }
  };

  const getFileBgColor = (type) => {
    switch(type) {
      case 'pdf': return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
      case 'image': return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      case 'video': return 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20';
      case 'doc': return 'bg-blue-50 dark:bg-blue-600/10 border-blue-200 dark:border-blue-600/20';
      default: return 'bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20';
    }
  };

  const filteredFiles = files.filter(f => {
    const matchCat = activeCategory === 'All' || f.category === activeCategory;
    const matchType = activeType === 'All' || f.type === activeType;
    const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex-1 w-full max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search files, notes, papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-500/50 shadow-sm transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative z-20">
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/[0.06] text-sm font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm ${activeType !== 'All' ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-100 dark:bg-[#0a0f1e]/60 hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-800 dark:text-white'}`}
              >
                <Filter size={16} /> {activeType === 'All' ? 'Filter' : activeType}
              </button>
              
              {showFilterDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-widest">File Type</p>
                    {['All', 'pdf', 'doc', 'image', 'video'].map(type => (
                      <button 
                        key={type}
                        onClick={() => { setActiveType(type); setShowFilterDropdown(false); }}
                        className={`text-left px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-between ${activeType === type ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        <span className="capitalize">{type}</span>
                        {activeType === type && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex-1 md:flex-none relative h-full flex">
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
              <label htmlFor="file-upload" className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-blue-500/20 cursor-pointer text-center">
                <Upload size={18} /> Upload
              </label>
            </div>
          </div>
        </div>

        {/* Directory Structure / Categories */}
        <div className="flex overflow-x-auto gap-3 pb-4 mb-4 custom-scrollbar">
          {Categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all whitespace-nowrap ${
                activeCategory === cat 
                  ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm' 
                  : 'bg-white dark:bg-[#0a0f1e]/60 border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/[0.1] shadow-sm'
              }`}
            >
              <FolderOpen size={16} className={activeCategory === cat ? 'text-blue-500' : 'text-slate-400'} />
              <span className="text-sm font-bold">{cat}</span>
            </button>
          ))}
        </div>

        {/* Generic Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 px-1">
           <span>My Cloud</span>
           <span className="text-slate-300 dark:text-slate-600">/</span>
           <span className="text-slate-800 dark:text-slate-300">{activeCategory}</span>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.length > 0 ? (
            filteredFiles.map(file => (
              <div key={file.id} className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] hover:border-blue-300 dark:hover:border-blue-500/50 rounded-xl p-4 transition-colors group relative shadow-sm h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${getFileBgColor(file.type)}`}>
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => toggleFavorite(file.id)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Heart size={16} className={file.favorite ? "fill-rose-500 text-rose-500" : "text-slate-400"} />
                    </button>
                    <div className="relative inline-block group/menu">
                      <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                      
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 flex flex-col p-1">
                        <button onClick={() => openFile(file)} className="text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg flex items-center gap-2">
                          <FolderOpen size={14}/> Open
                        </button>
                        <button onClick={() => downloadFile(file)} className="text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg flex items-center gap-2">
                          <Download size={14}/> Download
                        </button>
                        <button onClick={() => deleteFile(file.id)} className="text-left px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg flex items-center gap-2">
                          <Trash2 size={14}/> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={file.name}>
                  {file.name}
                </h3>

                <button
                  onClick={() => openFile(file)}
                  className={`text-xs font-semibold text-left ${hasStoredFile(file) ? 'text-blue-600 dark:text-blue-400 hover:underline' : 'text-slate-400 cursor-not-allowed'}`}
                >
                  {hasStoredFile(file) ? 'Open file' : 'Re-upload to open'}
                </button>
                
                <div className="mt-auto pt-4 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {file.category}
                  </span>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>{file.size}</span>
                    <span>{new Date(file.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-slate-50 dark:bg-white/[0.02] border border-slate-200 border-dashed dark:border-white/[0.05] rounded-2xl">
              <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Search className="text-slate-400" size={24} />
              </div>
              <h3 className="text-slate-800 dark:text-white font-bold mb-1">No files found</h3>
              <p className="text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

      </div>

      {/* Upload Details Modal */}
      {stagedFile && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setStagedFile(null)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">File Details</h3>
              <button onClick={() => setStagedFile(null)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 rounded-full p-1 border border-slate-200 dark:border-transparent">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={confirmUpload} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">File Name</label>
                <input
                  type="text"
                  required
                  value={uploadFormData.name}
                  onChange={(e) => setUploadFormData({...uploadFormData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., Physics_Notes_Ch1"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Category</label>
                <select
                  value={uploadFormData.category}
                  onChange={(e) => setUploadFormData({...uploadFormData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                >
                  {UploadCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                <button type="button" onClick={() => setStagedFile(null)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl transition-colors text-sm font-bold uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20">
                  Confirm Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResourcesPage;