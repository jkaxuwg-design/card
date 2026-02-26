import React, { useState, useRef, useEffect } from 'react';
import { THEMES, ThemeConfig } from './config/themes';
import { Stage, Layer, Rect, Text, Group, Label, Tag, Image as KonvaImage, Transformer, Line } from 'react-konva';
import { Download, LayoutTemplate, Type, Hash, Image as ImageIcon, Plus, Trash2, Globe, AlignLeft, AlignCenter, AlignRight, Save, X } from 'lucide-react';
import useImage from 'use-image';

type ElementType = 'title' | 'body' | 'tag' | 'image';
type Lang = 'en' | 'zh';

interface CanvasElement {
  id: string;
  type: ElementType;
  text?: string;
  src?: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
}

const TRANSLATIONS = {
  en: {
    appName: 'RaTEL AI Engine',
    appSubtitle: 'Auto-Layout MVP',
    sectionContent: 'Content',
    sectionThemes: 'Themes (Big 10)',
    sectionTemplates: 'Templates',
    btnAddImage: 'Add Image',
    btnAddText: 'Add Text',
    btnExport: 'Export Image',
    btnSaveTemplate: 'Save Template',
    placeholderTitle: 'Enter title...',
    placeholderBody: 'Enter body text...',
    placeholderTag: 'Tag',
    labelSize: 'Size',
    labelAlign: 'Align',
  },
  zh: {
    appName: 'RaTEL AI 排版引擎',
    appSubtitle: '自动排版 MVP',
    sectionContent: '内容编辑',
    sectionThemes: '十大巨头风格',
    sectionTemplates: '我的模板',
    btnAddImage: '添加图片',
    btnAddText: '添加文本',
    btnExport: '导出图片',
    btnSaveTemplate: '保存模板',
    placeholderTitle: '输入标题...',
    placeholderBody: '输入正文...',
    placeholderTag: '标签',
    labelSize: '字号',
    labelAlign: '对齐',
  }
};

// Initial elements with a placeholder image
const INITIAL_ELEMENTS: CanvasElement[] = [
  { id: 'title', type: 'title', text: 'AI Daily News', x: 60, y: 100, width: 480, align: 'left' },
  { id: 'body', type: 'body', text: 'OpenAI just released a new model that changes everything. Here is what you need to know about the latest developments in artificial intelligence.', x: 60, y: 500, width: 480, align: 'left' },
  { id: 'tag1', type: 'tag', text: '#AI', x: 60, y: 60, width: 0 },
  { id: 'tag2', type: 'tag', text: '#Tech', x: 140, y: 60, width: 0 },
];

// Increased canvas size (1.5x larger than before)
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800; // 3:4 aspect ratio

// URLImage component for loading images in Konva
const URLImage = ({ element, isSelected, onSelect, onChange, theme, onDragMove, onDragEnd }: { 
  element: CanvasElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onChange: (newAttrs: Partial<CanvasElement>) => void,
  theme: ThemeConfig,
  onDragMove?: (e: any) => void,
  onDragEnd?: (e: any) => void
}) => {
  const [image] = useImage(element.src || '');
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        image={image}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height || (image ? (image.height * (element.width / image.width)) : 200)}
        draggable
        onDragMove={onDragMove}
        rotation={element.rotation}
        scaleX={element.scaleX}
        scaleY={element.scaleY}
        cornerRadius={theme.cardRadius} // Match theme radius
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
          if (onDragEnd) onDragEnd(e);
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // Reset scale to 1 and adjust width/height instead for consistent behavior
          // But for images, keeping scale is often easier for Konva, 
          // however, to keep data clean we might want to normalize.
          // For now, let's just save the transform.
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            scaleX: scaleX,
            scaleY: scaleY,
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

// Helper to generate grid lines for Blueprint theme
const BlueprintGrid = () => {
  const lines = [];
  const step = 40;
  for (let i = 0; i < CANVAS_WIDTH; i += step) {
    lines.push(
      <Line key={`v-${i}`} points={[i, 0, i, CANVAS_HEIGHT]} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
    );
  }
  for (let i = 0; i < CANVAS_HEIGHT; i += step) {
    lines.push(
      <Line key={`h-${i}`} points={[0, i, CANVAS_WIDTH, i]} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
    );
  }
  return <Group>{lines}</Group>;
};

// Helper for IDE Line Numbers
const IDELineNumbers = () => {
  const lines = [];
  for (let i = 1; i <= 20; i++) {
    lines.push(
      <Text
        key={i}
        x={10}
        y={i * 30 + 60}
        text={i.toString().padStart(2, '0')}
        fontFamily="JetBrains Mono, monospace"
        fontSize={12}
        fill="#484f58"
      />
    );
  }
  return <Group>{lines}</Group>;
};

// Helper for Crypto Grid/Hash
const CryptoDecorations = () => {
  return (
    <Group>
      {/* Fine grid lines */}
      <Line points={[0, 100, CANVAS_WIDTH, 100]} stroke="#333333" strokeWidth={1} />
      <Line points={[0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, CANVAS_HEIGHT - 100]} stroke="#333333" strokeWidth={1} />
      
      {/* Hash code */}
      <Text
        x={CANVAS_WIDTH - 300}
        y={CANVAS_HEIGHT - 40}
        text="0x7f2a...9c3e • BLOCK 8921"
        fontFamily="JetBrains Mono, monospace"
        fontSize={10}
        fill="#333333"
        width={260}
        align="right"
      />
    </Group>
  );
};

// Helper for Pixel Grid
const PixelGrid = () => {
  const dots = [];
  const step = 20;
  for (let x = 0; x < CANVAS_WIDTH; x += step) {
    for (let y = 0; y < CANVAS_HEIGHT; y += step) {
      dots.push(
        <Rect
          key={`dot-${x}-${y}`}
          x={x}
          y={y}
          width={2}
          height={2}
          fill="rgba(255, 255, 255, 0.05)"
        />
      );
    }
  }
  return <Group>{dots}</Group>;
};

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [themeId, setThemeId] = useState<string>('apple');
  const [elements, setElements] = useState<CanvasElement[]>(INITIAL_ELEMENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const stageRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = THEMES[themeId];
  const t = TRANSLATIONS[lang];

  const [guides, setGuides] = useState<{ vertical: number | null; horizontal: number | null }>({ vertical: null, horizontal: null });
  const [templates, setTemplates] = useState<{ id: string; name: string; themeId: string; elements: CanvasElement[] }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('ratel_templates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load templates', e);
      }
    }
  }, []);

  const saveTemplate = () => {
    const name = prompt(lang === 'en' ? 'Enter template name:' : '输入模板名称:');
    if (name) {
      const newTemplate = {
        id: `tpl-${Date.now()}`,
        name,
        themeId,
        elements,
      };
      const newTemplates = [...templates, newTemplate];
      setTemplates(newTemplates);
      localStorage.setItem('ratel_templates', JSON.stringify(newTemplates));
    }
  };

  const loadTemplate = (tpl: typeof templates[0]) => {
    if (confirm(lang === 'en' ? 'Load this template? Current changes will be lost.' : '加载此模板？当前更改将丢失。')) {
      setThemeId(tpl.themeId);
      setElements(tpl.elements);
    }
  };

  const deleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(lang === 'en' ? 'Delete this template?' : '删除此模板？')) {
      const newTemplates = templates.filter(t => t.id !== id);
      setTemplates(newTemplates);
      localStorage.setItem('ratel_templates', JSON.stringify(newTemplates));
    }
  };

  const handleDragMove = (e: any, currentId: string) => {
    const node = e.target;
    const stage = node.getStage();
    
    // Snap tolerance
    const SNAP = 10;
    
    // Current node geometry
    let x = node.x();
    let y = node.y();
    const w = node.width() * node.scaleX();
    const h = node.height() * node.scaleY();
    
    let newX = x;
    let newY = y;
    let newV: number | null = null;
    let newH: number | null = null;
    
    // Collect all snap lines from other elements and canvas center
    const vLines: number[] = [CANVAS_WIDTH / 2]; // Vertical lines (X coords)
    const hLines: number[] = [CANVAS_HEIGHT / 2]; // Horizontal lines (Y coords)
    
    elements.forEach(el => {
      if (el.id === currentId) return;
      // Find the Konva node to get accurate dimensions (especially for Text)
      const other = stage.findOne('#' + el.id);
      if (other) {
        const ow = other.width() * other.scaleX();
        const oh = other.height() * other.scaleY();
        const ox = other.x();
        const oy = other.y();
        
        vLines.push(ox, ox + ow / 2, ox + ow);
        hLines.push(oy, oy + oh / 2, oy + oh);
      }
    });
    
    // --- Horizontal Snapping (Y-axis) ---
    let minDiffH = SNAP + 1;
    
    // 1. Top edge to lines
    hLines.forEach(line => {
      const diff = Math.abs(line - y);
      if (diff < minDiffH) {
        minDiffH = diff;
        newY = line;
        newH = line;
      }
    });
    
    // 2. Center to lines
    const centerY = y + h / 2;
    hLines.forEach(line => {
      const diff = Math.abs(line - centerY);
      if (diff < minDiffH) {
        minDiffH = diff;
        newY = line - h / 2;
        newH = line;
      }
    });
    
    // 3. Bottom edge to lines
    const bottomY = y + h;
    hLines.forEach(line => {
      const diff = Math.abs(line - bottomY);
      if (diff < minDiffH) {
        minDiffH = diff;
        newY = line - h;
        newH = line;
      }
    });

    // --- Vertical Snapping (X-axis) ---
    let minDiffV = SNAP + 1;
    
    // 1. Left edge to lines
    vLines.forEach(line => {
      const diff = Math.abs(line - x);
      if (diff < minDiffV) {
        minDiffV = diff;
        newX = line;
        newV = line;
      }
    });
    
    // 2. Center to lines
    const centerX = x + w / 2;
    vLines.forEach(line => {
      const diff = Math.abs(line - centerX);
      if (diff < minDiffV) {
        minDiffV = diff;
        newX = line - w / 2;
        newV = line;
      }
    });
    
    // 3. Right edge to lines
    const rightX = x + w;
    vLines.forEach(line => {
      const diff = Math.abs(line - rightX);
      if (diff < minDiffV) {
        minDiffV = diff;
        newX = line - w;
        newV = line;
      }
    });

    // Apply snap
    node.position({ x: newX, y: newY });
    
    // Update guides state
    if (newV !== guides.vertical || newH !== guides.horizontal) {
      setGuides({ vertical: newV, horizontal: newH });
    }
  };

  const handleDragEnd = (e: any, id: string) => {
    const node = e.target;
    setElements(
      elements.map((el) => {
        if (el.id === id) {
          return { ...el, x: node.x(), y: node.y() };
        }
        return el;
      })
    );
    setGuides({ vertical: null, horizontal: null });
  };

  const handleTextChange = (id: string, newText: string) => {
    setElements(elements.map(el => el.id === id ? { ...el, text: newText } : el));
  };

  const handleElementChange = (id: string, newAttrs: Partial<CanvasElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...newAttrs } : el));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const id = `img-${Date.now()}`;
        const newImage: CanvasElement = {
          id,
          type: 'image',
          src: reader.result as string,
          x: 60,
          y: 200,
          width: 480, // Default width
          height: 300, // Placeholder, will be adjusted by aspect ratio
        };
        setElements([...elements, newImage]);
        setSelectedId(id);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddText = () => {
    const id = `text-${Date.now()}`;
    const newText: CanvasElement = {
      id,
      type: 'body',
      text: 'New paragraph text...',
      x: 60,
      y: elements.length > 0 ? elements[elements.length - 1].y + 60 : 100,
      width: 480,
    };
    setElements([...elements, newText]);
    setSelectedId(id);
    setEditingId(id); // Immediately start editing
  };

  const handleDeleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleExport = () => {
    if (stageRef.current) {
      // Deselect everything before export to hide transformers/selection UI
      const prevSelected = selectedId;
      setSelectedId(null);
      
      // Wait for next tick to ensure render update
      setTimeout(() => {
        const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `ratel-ai-${themeId}.png`;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Restore selection
        setSelectedId(prevSelected);
      }, 0);
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  const getElementFontSize = (el: CanvasElement | undefined) => {
    if (!el) return 14;
    if (el.fontSize) return el.fontSize;
    if (el.type === 'title') return themeId === 'pixel' ? 32 : 42;
    if (el.type === 'body') return themeId === 'pixel' ? 16 : 20;
    return 14; // tag
  };

  const editingElement = editingId ? elements.find(e => e.id === editingId) : null;

  return (
    <div className="min-h-screen bg-neutral-950 flex font-sans text-neutral-200">
      {/* Left Console - Dark Mode */}
      <div className="w-96 bg-neutral-900 border-r border-neutral-800 flex flex-col h-screen overflow-y-auto shrink-0 z-10 shadow-xl">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <LayoutTemplate className="w-6 h-6 text-indigo-500" />
              {t.appName}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">{t.appSubtitle}</p>
          </div>
          <button 
            onClick={toggleLang}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Switch Language"
          >
            <Globe className="w-4 h-4" />
            <span className="sr-only">Switch Language</span>
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-8">
          {/* Content Inputs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t.sectionContent}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleAddText}
                  className="text-xs flex items-center gap-1 text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                >
                  <Type className="w-3 h-3" /> {t.btnAddText}
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs flex items-center gap-1 text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                >
                  <Plus className="w-3 h-3" /> {t.btnAddImage}
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>
            
            {elements.map((el) => (
              <div key={el.id} className="group relative space-y-1 p-3 rounded-lg border border-transparent hover:border-neutral-700 hover:bg-neutral-800 transition-all">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                    {el.type === 'title' && <Type className="w-3 h-3" />}
                    {el.type === 'body' && <Type className="w-3 h-3" />}
                    {el.type === 'tag' && <Hash className="w-3 h-3" />}
                    {el.type === 'image' && <ImageIcon className="w-3 h-3" />}
                    {el.id}
                  </label>
                  <button 
                    onClick={() => handleDeleteElement(el.id)}
                    className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {el.type === 'body' ? (
                  <textarea
                    value={el.text}
                    onChange={(e) => handleTextChange(el.id, e.target.value)}
                    placeholder={t.placeholderBody}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-24 resize-none placeholder-neutral-600"
                  />
                ) : el.type === 'image' ? (
                  <div className="w-full h-20 bg-neutral-800 rounded-md flex items-center justify-center overflow-hidden border border-neutral-700">
                    <img src={el.src} alt="preview" className="w-full h-full object-cover opacity-60" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={el.text}
                    onChange={(e) => handleTextChange(el.id, e.target.value)}
                    placeholder={el.type === 'title' ? t.placeholderTitle : t.placeholderTag}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-neutral-600"
                  />
                )}

                {/* Font Size and Align Control for Title and Body */}
                {(el.type === 'title' || el.type === 'body') && (
                  <div className="flex flex-col gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider w-8">{t.labelSize || 'Size'}</span>
                      <input
                        type="range"
                        min="12"
                        max="120"
                        step="1"
                        value={getElementFontSize(el)}
                        onChange={(e) => handleElementChange(el.id, { fontSize: parseInt(e.target.value) })}
                        className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <span className="text-[10px] text-neutral-400 w-6 text-right font-mono">{getElementFontSize(el)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider w-8">{t.labelAlign || 'Align'}</span>
                      <div className="flex gap-1">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            onClick={() => handleElementChange(el.id, { align })}
                            className={`p-1 rounded ${el.align === align ? 'bg-indigo-500 text-white' : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'}`}
                            title={align}
                          >
                            {align === 'left' && <AlignLeft className="w-3 h-3" />}
                            {align === 'center' && <AlignCenter className="w-3 h-3" />}
                            {align === 'right' && <AlignRight className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Templates Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t.sectionTemplates}</h2>
              <button 
                onClick={saveTemplate}
                className="text-xs flex items-center gap-1 text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
              >
                <Save className="w-3 h-3" /> {t.btnSaveTemplate}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(tpl => (
                <div key={tpl.id} className="group relative p-3 bg-neutral-800 rounded-lg border border-neutral-700 hover:border-indigo-500/50 transition-all cursor-pointer" onClick={() => loadTemplate(tpl)}>
                  <div className="text-sm font-medium text-neutral-300 truncate">{tpl.name}</div>
                  <div className="text-[10px] text-neutral-500 mt-1">{THEMES[tpl.themeId]?.name || tpl.themeId}</div>
                  <button 
                    onClick={(e) => deleteTemplate(tpl.id, e)}
                    className="absolute top-1 right-1 p-1 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="col-span-2 text-center py-4 text-xs text-neutral-600 italic">
                  {lang === 'en' ? 'No templates saved' : '暂无保存的模板'}
                </div>
              )}
            </div>
          </div>

          {/* Theme Switcher */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t.sectionThemes}</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(THEMES).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`px-3 py-3 text-sm font-medium rounded-lg border text-left transition-all ${
                    themeId === t.id
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 ring-1 ring-indigo-500/50'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:border-neutral-600 hover:text-neutral-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-800 bg-neutral-900">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-900/20"
          >
            <Download className="w-4 h-4" />
            {t.btnExport}
          </button>
        </div>
      </div>

      {/* Right Canvas Area - Dark Mode Background */}
      <div className="flex-1 flex items-center justify-center bg-neutral-950 p-8 overflow-auto">
        <div 
          className="relative shadow-2xl transition-all duration-300 ease-in-out shrink-0"
          style={{ 
            width: CANVAS_WIDTH, 
            height: CANVAS_HEIGHT,
            borderRadius: theme.cardRadius,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' // Stronger shadow for dark mode
          }}
        >
          <Stage
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            ref={stageRef}
            onMouseDown={(e) => {
              // Deselect when clicking on empty area
              const clickedOnEmpty = e.target === e.target.getStage();
              if (clickedOnEmpty) {
                setSelectedId(null);
                setEditingId(null);
              }
            }}
          >
            <Layer>
              {/* Background Card */}
              <Rect
                x={0}
                y={0}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill={theme.bg}
                cornerRadius={theme.cardRadius}
                stroke={theme.cardBorder !== 'transparent' ? theme.cardBorder : undefined}
                strokeWidth={theme.id === 'pixel' ? 4 : 1} // Thicker border for pixel theme
                shadowColor={theme.cardShadow !== 'transparent' ? theme.cardShadow : undefined}
                shadowBlur={theme.shadowBlur || 0}
                shadowOffsetY={theme.shadowOffsetY || 0}
                shadowOpacity={1}
              />

              {/* Theme Specific Decorations */}
              {themeId === 'blueprint' && <BlueprintGrid />}
              {themeId === 'ide' && <IDELineNumbers />}
              {themeId === 'crypto' && <CryptoDecorations />}
              {themeId === 'pixel' && <PixelGrid />}

              {/* Elements */}
              {elements.map((el) => {
                const isSelected = el.id === selectedId;
                
                if (el.type === 'image') {
                  return (
                    <URLImage
                      key={el.id}
                      element={el}
                      isSelected={isSelected}
                      onSelect={() => setSelectedId(el.id)}
                      onChange={(newAttrs) => handleElementChange(el.id, newAttrs)}
                      theme={theme}
                      onDragMove={(e) => handleDragMove(e, el.id)}
                      onDragEnd={(e) => handleDragEnd(e, el.id)}
                    />
                  );
                }

                if (el.type === 'tag') {
                  return (
                    <Label
                      key={el.id}
                      id={el.id}
                      x={el.x}
                      y={el.y}
                      draggable
                      onDragMove={(e) => handleDragMove(e, el.id)}
                      onDragEnd={(e) => handleDragEnd(e, el.id)}
                      onClick={() => setSelectedId(el.id)}
                      onTap={() => setSelectedId(el.id)}
                      onDblClick={() => setEditingId(el.id)}
                      onDblTap={() => setEditingId(el.id)}
                      opacity={editingId === el.id ? 0 : 1}
                    >
                      <Tag
                        fill={theme.tagBg}
                        cornerRadius={theme.tagRadius}
                        stroke={theme.tagBorder !== 'transparent' ? theme.tagBorder : undefined}
                        strokeWidth={theme.id === 'pixel' ? 2 : 1} // Thicker border for pixel tags
                        shadowColor={theme.id === 'grok' ? theme.tagColor : undefined}
                        shadowBlur={theme.id === 'grok' ? 10 : 0}
                      />
                      <Text
                        text={el.text}
                        fontFamily={theme.bodyFont}
                        fontSize={14}
                        fill={theme.tagColor}
                        padding={8}
                        fontStyle="bold"
                      />
                    </Label>
                  );
                }

                return (
                  <Text
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    text={el.text}
                    width={el.width}
                    fontFamily={el.type === 'title' ? theme.titleFont : theme.bodyFont}
                    fontSize={getElementFontSize(el)}
                    fontStyle={el.type === 'title' ? theme.titleWeight : theme.bodyWeight}
                    fill={el.type === 'title' ? theme.titleColor : theme.bodyColor}
                    align={el.align || 'left'}
                    lineHeight={theme.id === 'pixel' ? 1.6 : 1.4} // Wider line height for pixel theme
                    padding={el.type === 'title' ? 20 : 10} // Add padding for better typography
                    draggable
                    onDragMove={(e) => handleDragMove(e, el.id)}
                    onDragEnd={(e) => handleDragEnd(e, el.id)}
                    onClick={() => setSelectedId(el.id)}
                    onTap={() => setSelectedId(el.id)}
                    onDblClick={() => setEditingId(el.id)}
                    onDblTap={() => setEditingId(el.id)}
                    opacity={editingId === el.id ? 0 : 1}
                  />
                );
              })}

              {/* Alignment Guides */}
              {guides.vertical && (
                <Line
                  points={[guides.vertical, 0, guides.vertical, CANVAS_HEIGHT]}
                  stroke="#FF00FF"
                  strokeWidth={1}
                  dash={[4, 4]}
                />
              )}
              {guides.horizontal && (
                <Line
                  points={[0, guides.horizontal, CANVAS_WIDTH, guides.horizontal]}
                  stroke="#FF00FF"
                  strokeWidth={1}
                  dash={[4, 4]}
                />
              )}
            </Layer>
          </Stage>

          {/* HTML Overlay for Editing */}
          {editingElement && (
            <HtmlInputOverlay
              element={editingElement}
              theme={theme}
              onChange={(text) => handleTextChange(editingElement.id, text)}
              onClose={() => setEditingId(null)}
              fontSize={getElementFontSize(editingElement)}
              align={editingElement.align}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for in-place editing
function HtmlInputOverlay({ element, theme, onChange, onClose, fontSize, align }: { 
  element: CanvasElement; 
  theme: Theme; 
  onChange: (val: string) => void; 
  onClose: () => void; 
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
}) {
  const isTitle = element.type === 'title';
  const isTag = element.type === 'tag';
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only close on Enter for Tags. For Title and Body, Enter should add a new line.
      if (e.key === 'Escape' || (e.key === 'Enter' && isTag)) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTag, onClose]);

  return (
    <textarea
      autoFocus
      value={element.text}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onClose}
      style={{
        position: 'absolute',
        top: element.y + (isTag ? 6 : 0),
        left: element.x + (isTag ? 6 : 0),
        width: isTag ? 100 : element.width,
        height: isTitle ? 120 : isTag ? 30 : 300,
        fontSize: fontSize || (isTitle ? 42 : isTag ? 14 : 20),
        fontFamily: isTitle ? theme.titleFont : theme.bodyFont,
        fontWeight: isTitle ? theme.titleWeight : isTag ? 'bold' : theme.bodyWeight,
        color: isTitle ? theme.titleColor : isTag ? theme.tagColor : theme.bodyColor,
        textAlign: align || 'left',
        lineHeight: theme.id === 'pixel' ? 1.6 : 1.4,
        background: isTag ? theme.tagBg : 'transparent',
        border: '1px dashed #6366f1',
        outline: 'none',
        resize: 'none',
        padding: isTitle ? '20px' : '10px',
        margin: 0,
        overflow: 'hidden',
        zIndex: 10,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        boxSizing: 'border-box', // Ensure padding is included in width
      }}
    />
  );
}


