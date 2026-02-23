/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, Loader2, Settings2 } from 'lucide-react';
import { PerlerBeadGenerator, Algorithm } from './core/generator';
import { PaletteKey, brandNames } from './core/color_utils';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(40);
  const [height, setHeight] = useState<number>(40);
  const [algorithm, setAlgorithm] = useState<Algorithm>('average');
  const [palette, setPalette] = useState<PaletteKey>('mard');
  const [brightness, setBrightness] = useState<number>(0);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResultImage(null); // Clear previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!image) return;
    
    // Validate dimensions
    const w = Math.min(Math.max(1, width), 120);
    const h = Math.min(Math.max(1, height), 120);
    setWidth(w);
    setHeight(h);

    setIsGenerating(true);
    
    try {
      const imgElement = new Image();
      imgElement.src = image;
      await new Promise((resolve) => {
        imgElement.onload = resolve;
      });

      // Use setTimeout to allow UI to update loading state before heavy processing
      setTimeout(async () => {
        try {
          const result = await PerlerBeadGenerator.generate(imgElement, w, h, algorithm, palette, brightness);
          setResultImage(result);
        } catch (error) {
          console.error("Generation failed:", error);
          alert("生成图纸失败，请重试。 Generation failed, please try again.");
        } finally {
          setIsGenerating(false);
        }
      }, 50);
      
    } catch (error) {
      console.error("Image loading failed:", error);
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `perler-pattern-${width}x${height}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#E8DDCE]/30 text-neutral-900 font-sans selection:bg-[#E8BB9C]/50 selection:text-[#B78B69]">
      {/* Header */}
      <header className="bg-white border-b border-[#D3DBE2] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#B78B69] rounded-lg flex items-center justify-center shadow-sm">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-[#B78B69]">豆拼拼-图纸工厂 <span className="text-neutral-400 text-base font-normal ml-2 hidden sm:inline">Perler Pattern Factory</span></h1>
          </div>
          <div className="text-sm text-neutral-500 font-medium">v1.2.0</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-[#D3DBE2] p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-[#D3DBE2]/50 pb-4">
                <Settings2 className="w-5 h-5 text-[#B78B69]" />
                <h2 className="text-lg font-medium text-[#B78B69]">参数设置 <span className="text-neutral-400 text-sm font-normal ml-1">Parameters</span></h2>
              </div>

              {/* Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">上传原图 <span className="text-neutral-400 font-normal ml-1">Upload Image</span></label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#D3DBE2] border-dashed rounded-xl hover:border-[#B78B69] hover:bg-[#E8DDCE]/20 transition-colors cursor-pointer group"
                >
                  <div className="space-y-1 text-center">
                    {image ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden">
                        <img src={image} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-[#D3DBE2] group-hover:text-[#B78B69] transition-colors" />
                        <div className="flex text-sm text-neutral-600 justify-center">
                          <span className="relative rounded-md font-medium text-[#B78B69] hover:text-[#B78B69]/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#B78B69]">
                            点击上传图片 Click to upload
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500">支持 PNG, JPG 格式</p>
                      </>
                    )}
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/jpeg, image/png" 
                  className="hidden" 
                />
              </div>

              {/* Dimensions */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">宽度 <span className="text-neutral-400 font-normal ml-1">Width</span> (Max: 120)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="120" 
                      value={width} 
                      onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
                      className="block w-full rounded-lg border-[#D3DBE2] shadow-sm focus:border-[#B78B69] focus:ring-[#B78B69] sm:text-sm px-3 py-2 border outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">高度 <span className="text-neutral-400 font-normal ml-1">Height</span> (Max: 120)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="120" 
                      value={height} 
                      onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
                      className="block w-full rounded-lg border-[#D3DBE2] shadow-sm focus:border-[#B78B69] focus:ring-[#B78B69] sm:text-sm px-3 py-2 border outline-none"
                    />
                  </div>
                </div>
                {/* Quick Sizes */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => { setWidth(18); setHeight(18); }} className="px-2 py-1 text-xs bg-[#E8DDCE]/50 hover:bg-[#E8DDCE] rounded text-[#B78B69] transition-colors border border-[#E8DDCE]">18x18 (小挂件 Small)</button>
                  <button onClick={() => { setWidth(36); setHeight(36); }} className="px-2 py-1 text-xs bg-[#E8DDCE]/50 hover:bg-[#E8DDCE] rounded text-[#B78B69] transition-colors border border-[#E8DDCE]">36x36</button>
                  <button onClick={() => { setWidth(52); setHeight(52); }} className="px-2 py-1 text-xs bg-[#E8DDCE]/50 hover:bg-[#E8DDCE] rounded text-[#B78B69] transition-colors border border-[#E8DDCE]">52x52 (标准 Std)</button>
                  <button onClick={() => { setWidth(72); setHeight(72); }} className="px-2 py-1 text-xs bg-[#E8DDCE]/50 hover:bg-[#E8DDCE] rounded text-[#B78B69] transition-colors border border-[#E8DDCE]">72x72</button>
                </div>
              </div>

              {/* Algorithm */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">降采样算法 <span className="text-neutral-400 font-normal ml-1">Downsampling</span></label>
                <select 
                  value={algorithm} 
                  onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
                  className="block w-full rounded-lg border-[#D3DBE2] shadow-sm focus:border-[#B78B69] focus:ring-[#B78B69] sm:text-sm px-3 py-2 border bg-white outline-none"
                >
                  <option value="average">区域平均 (Average) - 推荐</option>
                  <option value="gradient_enhanced">梯度增强 (Gradient Enhanced) - 锐利</option>
                  <option value="nearest">临近插值 (Nearest) - 像素级</option>
                </select>
              </div>

              {/* Palette */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">色系选择 <span className="text-neutral-400 font-normal ml-1">Palette</span></label>
                <select 
                  value={palette} 
                  onChange={(e) => setPalette(e.target.value as PaletteKey)}
                  className="block w-full rounded-lg border-[#D3DBE2] shadow-sm focus:border-[#B78B69] focus:ring-[#B78B69] sm:text-sm px-3 py-2 border bg-white outline-none"
                >
                  {brandNames.map(brand => (
                    <option key={brand} value={brand}>{brand}色卡</option>
                  ))}
                </select>
              </div>

              {/* Brightness */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">亮度调节 <span className="text-neutral-400 font-normal ml-1">Brightness</span></label>
                <input 
                  type="range" 
                  min="-2" 
                  max="2" 
                  step="1" 
                  value={brightness} 
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full accent-[#B78B69]"
                />
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>-2 (暗 Dark)</span>
                  <span>0 (默认 Default)</span>
                  <span>+2 (亮 Light)</span>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!image || isGenerating}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white ${
                  !image || isGenerating ? 'bg-[#D3DBE2] cursor-not-allowed text-neutral-500' : 'bg-[#B78B69] hover:bg-[#B78B69]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B78B69]'
                } transition-colors`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    生成中 Generating...
                  </>
                ) : (
                  '生成图纸 Generate'
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Result */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-[#D3DBE2] p-6 h-full min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between border-b border-[#D3DBE2]/50 pb-4 mb-4">
                <h2 className="text-lg font-medium text-[#B78B69]">预览结果 <span className="text-neutral-400 text-sm font-normal ml-1">Preview</span></h2>
                {resultImage && (
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-4 py-2 border border-[#D3DBE2] shadow-sm text-sm font-medium rounded-lg text-[#B78B69] bg-white hover:bg-[#E8DDCE]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B78B69] transition-colors"
                  >
                    <Download className="-ml-1 mr-2 h-4 w-4 text-[#B78B69]" />
                    下载图纸 Download
                  </button>
                )}
              </div>

              <div className="flex-1 bg-[#E8DDCE]/20 rounded-xl border border-[#D3DBE2] overflow-hidden flex items-center justify-center relative">
                {isGenerating ? (
                  <div className="flex flex-col items-center text-[#B78B69]">
                    <Loader2 className="animate-spin h-10 w-10 mb-4 text-[#B78B69]" />
                    <p>正在处理图像并匹配色号 Processing...</p>
                  </div>
                ) : resultImage ? (
                  <div className="w-full h-full overflow-auto p-4 flex items-center justify-center">
                    <img 
                      src={resultImage} 
                      alt="Generated Pattern" 
                      className="max-w-none shadow-md"
                      style={{ maxHeight: '800px' }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-neutral-400">
                    <ImageIcon className="mx-auto h-12 w-12 mb-3 opacity-30 text-[#B78B69]" />
                    <p>上传图片并点击生成，在此预览图纸<br/><span className="text-sm">Upload an image and generate to preview</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
