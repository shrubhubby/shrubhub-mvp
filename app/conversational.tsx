import { View, StyleSheet } from 'react-native';

export default function ConversationalScreen() {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
