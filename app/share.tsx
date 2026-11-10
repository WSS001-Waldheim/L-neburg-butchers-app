import React, { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { WoodBackground } from '../src/components/WoodBackground';
import { APP_DOWNLOAD_URL } from '../src/config/appDownload';
import { colors } from '../src/theme/colors';
import { type } from '../src/theme/typography';

export default function ShareAppScreen() {
  const [notice, setNotice] = useState<string | null>(null);

  const onShare = async () => {
    setNotice(null);
    try {
      await Share.share({
        title: 'Lüneburg Country Butchery',
        message: `Lüneburg Country Butchery\n${APP_DOWNLOAD_URL}`,
        url: APP_DOWNLOAD_URL,
      });
    } catch {
      setNotice('Sharing is not available on this device. Use the link below.');
    }
  };

  return (
    <WoodBackground>
      <View style={styles.content}>
        <Text style={styles.heading}>Share the app</Text>
        <Text style={styles.body}>
          Scan this code to download Lüneburg Country Butchery.
        </Text>
        <View style={styles.qrWrap}>
          <QRCode
            value={APP_DOWNLOAD_URL}
            size={220}
            color={colors.forestDeep}
            backgroundColor={colors.mist}
          />
        </View>
        <Text style={styles.link} selectable>
          {APP_DOWNLOAD_URL}
        </Text>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <PrimaryButton
          label="Share"
          onPress={onShare}
          style={{ marginTop: 20 }}
        />
      </View>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, alignItems: 'center' },
  heading: {
    ...type.section,
    color: colors.forestDeep,
    alignSelf: 'stretch',
  },
  body: {
    ...type.body,
    color: colors.ink,
    marginTop: 10,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  qrWrap: {
    padding: 16,
    backgroundColor: colors.mist,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  link: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 16,
    textAlign: 'center',
  },
  notice: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 10,
    textAlign: 'center',
  },
});
