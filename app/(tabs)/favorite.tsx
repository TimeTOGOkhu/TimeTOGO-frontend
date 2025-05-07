import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoriteScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', }} edges={['top']}>
        <View style={{  }}>
            <View style={{ height:72, width:'100%', justifyContent:'center', borderBottomColor:'#C6C8C9', borderBottomWidth:1 }}>
                <Text style={{ fontSize:30, fontWeight:'bold', color:'#3457D5', textAlign:'center' }}>즐겨찾기</Text>
            </View>
          
        </View>
    </SafeAreaView>
  );
} 