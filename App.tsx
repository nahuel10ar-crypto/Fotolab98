import React, { useMemo, useRef, useState } from 'react';
import { Alert, Image, PanResponder, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const tools = [
  { id:'exposure', label:'Exposición', icon:'sunny-outline' },
  { id:'contrast', label:'Contraste', icon:'contrast-outline' },
  { id:'saturation', label:'Saturación', icon:'color-palette-outline' },
  { id:'warmth', label:'Temperatura', icon:'thermometer-outline' },
  { id:'sharpness', label:'Nitidez', icon:'scan-outline' },
  { id:'grain', label:'Grano', icon:'sparkles-outline' },
] as const;

type Tool = typeof tools[number]['id'];
type Adjustments = Record<Tool, number>;

const initialAdjustments: Adjustments = {
  exposure: 0, contrast: 0, saturation: 0, warmth: 0, sharpness: 0, grain: 0,
};

function Slider({ value, onChange }: { value:number; onChange:(v:number)=>void }) {
  const width = useRef(Dimensions.get('window').width - 82).current;
  const start = useRef(value).current;
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { start.current = value; },
    onPanResponderMove: (_, g) => {
      const next = Math.max(-100, Math.min(100, start.current + (g.dx / width) * 200));
      onChange(Math.round(next));
    },
  }), [value, width, onChange]);
  const pct = (value + 100) / 2;
  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderValue}>−100</Text>
      <View style={styles.slider} {...responder.panHandlers}>
        <View style={[styles.trackFill, { width: `${pct}%` }]} />
        <View style={[styles.knob, { left: `${pct}%` }]} />
      </View>
      <Text style={styles.sliderValue}>+100</Text>
    </View>
  );
}

export default function App() {
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('exposure');
  const [adjustments, setAdjustments] = useState<Adjustments>(initialAdjustments);
  const [saving, setSaving] = useState(false);

  const activeTool = tools.find(t => t.id === tool)!;
  const value = adjustments[tool];

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'FotoLab necesita acceso a tus fotos para poder editarlas.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 1, allowsEditing: false,
    });
    if (!result.canceled) {
      setOriginalUri(result.assets[0].uri);
      setUri(result.assets[0].uri);
      setAdjustments(initialAdjustments);
    }
  }

  function setValue(v:number) {
    setAdjustments(prev => ({ ...prev, [tool]: v }));
  }

  function reset() {
    setAdjustments(initialAdjustments);
  }

  async function rotate() {
    if (!uri) return;
    try {
      const result = await ImageManipulator.manipulateAsync(uri, [{ rotate: 90 }], { compress: 1, format: ImageManipulator.SaveFormat.JPEG });
      setUri(result.uri);
      setOriginalUri(result.uri);
    } catch { Alert.alert('Error', 'No se pudo rotar la imagen.'); }
  }

  async function crop() {
    if (!uri) return;
    Alert.alert('Recortar', 'En la próxima versión vamos a incorporar el recorte libre. Por ahora podés rotar y ajustar la imagen sin modificar el original.');
  }

  async function savePhoto() {
    if (!uri || saving) return;
    setSaving(true);
    try {
      const result = await ImageManipulator.manipulateAsync(uri, [], { compress: 0.96, format: ImageManipulator.SaveFormat.JPEG });
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso necesario', 'Necesitamos permiso para guardar la foto en tu galería.');
        setSaving(false); return;
      }
      await MediaLibrary.saveToLibraryAsync(result.uri);
      Alert.alert('Foto guardada', 'La imagen se guardó en tu galería.');
    } catch { Alert.alert('Error', 'No se pudo guardar la imagen.'); }
    finally { setSaving(false); }
  }

  function requestAI() {
    Alert.alert('IA — bajo tu control', 'La IA no se ejecuta automáticamente. Elegí una acción cuando quieras incorporarla.', [
      { text:'Cancelar', style:'cancel' },
      { text:'Ver acciones', onPress: () => Alert.alert('Próximamente', 'Mejorar calidad · Mejorar rostro · Quitar objeto · Mejorar iluminación · Upscale') }
    ]);
  }

  function closeEditor() {
    setOriginalUri(null); setUri(null); setAdjustments(initialAdjustments);
  }

  if (!uri) return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.home}>
        <View style={styles.logo}><Ionicons name="sparkles" size={26} color="#fff" /></View>
        <Text style={styles.brand}>FotoLab</Text>
        <Text style={styles.subtitle}>Tu editor personal de fotos y videos.</Text>
        <View style={styles.hero}><Ionicons name="image-outline" size={70} color="#777" /><Text style={styles.heroText}>Elegí una foto para empezar</Text></View>
        <Pressable style={styles.primary} onPress={pickPhoto}><Ionicons name="images-outline" size={21} color="#fff" /><Text style={styles.primaryText}>Elegir foto</Text></Pressable>
        <Text style={styles.note}>La IA nunca modifica una foto automáticamente.</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.editorHeader}>
        <Pressable onPress={closeEditor}><Ionicons name="chevron-back" size={28} color="#fff" /></Pressable>
        <Text style={styles.headerTitle}>Editar foto</Text>
        <Pressable onPress={savePhoto} disabled={saving}><Ionicons name="checkmark" size={28} color={saving ? '#555' : '#fff'} /></Pressable>
      </View>
      <View style={styles.preview}><Image source={{uri}} style={styles.image} resizeMode="contain" /></View>
      <View style={styles.quickActions}>
        <Pressable style={styles.quick} onPress={crop}><Ionicons name="crop-outline" size={21} color="#fff" /><Text style={styles.quickText}>Recortar</Text></Pressable>
        <Pressable style={styles.quick} onPress={rotate}><Ionicons name="refresh-outline" size={21} color="#fff" /><Text style={styles.quickText}>Rotar</Text></Pressable>
        <Pressable style={styles.quick} onPress={reset}><Ionicons name="refresh-circle-outline" size={21} color="#fff" /><Text style={styles.quickText}>Reset</Text></Pressable>
      </View>
      <Pressable style={styles.aiButton} onPress={requestAI}><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.aiText}>Editar con IA</Text></Pressable>
      <View style={styles.controls}>
        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>{activeTool.label}</Text><Text style={styles.currentValue}>{value > 0 ? '+' : ''}{value}</Text></View>
        <Slider value={value} onChange={setValue} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolList}>
          {tools.map(t => <Pressable key={t.id} onPress={() => setTool(t.id)} style={[styles.tool, tool === t.id && styles.toolActive]}><Ionicons name={t.icon as any} size={22} color={tool === t.id ? '#fff' : '#999'} /><Text style={[styles.toolText, tool === t.id && styles.toolTextActive]}>{t.label}</Text></Pressable>)}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#0b0b0d'}, home:{flex:1,padding:26,alignItems:'center',justifyContent:'center'}, logo:{width:58,height:58,borderRadius:18,backgroundColor:'#6c4cff',alignItems:'center',justifyContent:'center',marginBottom:12}, brand:{fontSize:34,fontWeight:'800',color:'#fff'}, subtitle:{fontSize:15,color:'#999',marginTop:5,marginBottom:38}, hero:{width:'100%',height:260,borderRadius:24,borderWidth:1,borderColor:'#242428',backgroundColor:'#121216',alignItems:'center',justifyContent:'center',gap:14}, heroText:{color:'#777',fontSize:16}, primary:{marginTop:24,width:'100%',height:56,borderRadius:18,backgroundColor:'#6c4cff',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:10}, primaryText:{color:'#fff',fontSize:17,fontWeight:'700'}, note:{color:'#666',fontSize:12,marginTop:18}, editorHeader:{height:58,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},headerTitle:{color:'#fff',fontSize:17,fontWeight:'700'},preview:{flex:1,backgroundColor:'#050506',alignItems:'center',justifyContent:'center'},image:{width:'100%',height:'100%'},quickActions:{height:58,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:10},quick:{height:42,minWidth:86,paddingHorizontal:12,borderRadius:13,backgroundColor:'#151519',borderWidth:1,borderColor:'#29292f',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},quickText:{color:'#ddd',fontSize:12,fontWeight:'600'},aiButton:{marginHorizontal:14,marginBottom:8,height:46,borderRadius:15,backgroundColor:'#211b3f',borderWidth:1,borderColor:'#463887',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},aiText:{color:'#fff',fontWeight:'700'},controls:{paddingBottom:8},sectionRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:18,paddingTop:4},sectionTitle:{color:'#fff',fontSize:16,fontWeight:'700'},currentValue:{color:'#a99cff',fontSize:14,fontWeight:'700'},sliderRow:{height:54,flexDirection:'row',alignItems:'center',paddingHorizontal:15,gap:9},sliderValue:{color:'#777',fontSize:11},trackFill:{height:4,backgroundColor:'#6c4cff',borderRadius:4},slider: {height:22, flex:1, justifyContent:'center', position:'relative', backgroundColor:'#333', borderRadius:4},knob:{position:'absolute',top:3,width:16,height:16,borderRadius:8,backgroundColor:'#fff',marginLeft:-8},toolList:{paddingHorizontal:10,gap:6},tool:{width:82,height:62,borderRadius:13,alignItems:'center',justifyContent:'center',gap:4},toolActive:{backgroundColor:'#1c1930'},toolText:{color:'#999',fontSize:10,textAlign:'center'},toolTextActive:{color:'#fff',fontWeight:'700'}
});
