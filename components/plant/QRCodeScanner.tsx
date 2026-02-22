import React, { useState, useRef } from 'react'
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native'
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera'
import { Button } from '@/components/ui/Button'

interface QRCodeScannerProps {
  onScan: (data: string) => void
  onClose?: () => void
  isVisible?: boolean
  buttonLabel?: string
  scannerTitle?: string
}

export function QRCodeScanner({
  onScan,
  onClose,
  isVisible: controlledVisible,
  buttonLabel = 'Scan QR Code',
  scannerTitle = 'Point camera at QR code',
}: QRCodeScannerProps) {
  const [internalVisible, setInternalVisible] = useState(false)
  const [permission, requestPermission] = useCameraPermissions()
  const [hasScanned, setHasScanned] = useState(false)
  const cameraRef = useRef<CameraView>(null)

  // Support both controlled and uncontrolled modes
  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission()
      if (!result.granted) {
        return
      }
    }
    setHasScanned(false)
    setInternalVisible(true)
  }

  const closeScanner = () => {
    setInternalVisible(false)
    onClose?.()
  }

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (hasScanned) return

    if (result.data) {
      setHasScanned(true)
      onScan(result.data)
      closeScanner()
    }
  }

  return (
    <>
      {/* Only show button in uncontrolled mode */}
      {controlledVisible === undefined && (
        <Button variant="outline" onPress={openScanner}>
          <Text className="text-coal">{buttonLabel}</Text>
        </Button>
      )}

      <Modal
        visible={isVisible}
        animationType="slide"
        onRequestClose={closeScanner}
      >
        <View style={styles.container}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            {/* Semi-transparent overlay */}
            <View style={styles.overlay}>
              {/* Top */}
              <View style={styles.overlayTop} />

              {/* Middle row with scanner window */}
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.scannerWindow}>
                  {/* Corner markers */}
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />
                </View>
                <View style={styles.overlaySide} />
              </View>

              {/* Bottom */}
              <View style={styles.overlayBottom}>
                <Text style={styles.instructions}>{scannerTitle}</Text>
              </View>
            </View>

            {/* Close button */}
            <Pressable
              onPress={closeScanner}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </CameraView>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scannerWindow: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 24,
  },
  instructions: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
})
