import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

export default function ConversationalScreen() {
  // For web, use an iframe. For native, use WebView
  const isWeb = typeof window !== 'undefined' && window.document;

  if (isWeb) {
    return (
      <View style={styles.container}>
        <iframe
          src="/conversational.html"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="Conversational UI"
        />
      </View>
    );
  }

  return (
    <WebView
      source={require('../assets/conversational.html')}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
