import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  SafeAreaView,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {fetchWithAuth} from '../../api/auth';
import {AuthContext} from '../../context/AuthContext';
import Sound from 'react-native-sound';
import {useCache} from '../../hooks/useCache';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CardSkeleton from '../TipsModal/CardSkeleton';
import {BASE_URL} from '../../config';

interface Tip {
  id: number | string;
  title: string;
  body: string;
  details: string;
  audioUrl: string | null;
  categories?: string[];
  similarity_score?: number;
  query_relevance?: number;
  personal_match?: number;
  isGenerated?: boolean;
}

interface TipsModal {
  tips: Tip[];
  likedTips: Tip[];
  setLikedTips: (_arg0: Tip[]) => void;
  dislikedTips: Tip[];
  setDislikedTips: (_arg0: Tip[]) => void;
  showTipsModal: boolean;
  setShowTipsModal: (_arg0: boolean) => void;
  currentSound: React.MutableRefObject<Sound | null>;
  onReact: (
    tipId: string | number,
    type: 'like' | 'dislike' | 'save' | 'unsave',
  ) => void;
}

const TipsModal: React.FC<TipsModal> = ({
  tips,
  likedTips,
  setLikedTips,
  dislikedTips,
  setDislikedTips,
  showTipsModal,
  setShowTipsModal,
  currentSound,
}) => {
  const {userInfo} = useContext<any>(AuthContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudioKey, setActiveAudioKey] = useState<string | number | null>(
    null,
  );
  const [audioLoadingIndex, setAudioLoadingIndex] = useState<number | null>(
    null,
  );
  const {loadFromCache, saveToCache} = useCache();

  //   const audioCache = useRef<Map<string, string>>(new Map());

  const tinyHash = (s: string) =>
    [...s].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString();
  const tipKey = (t: Tip) =>
    typeof t.id === 'number' && !t.isGenerated
      ? `db:${t.id}`
      : `ai:${tinyHash(`${t.title || ''}|${t.body || ''}|${t.details || ''}`)}`;

  const isTipLiked = (tip: Tip) =>
    likedTips.some(x => tipKey(x) === tipKey(tip));
  const isTipDisliked = (tip: Tip) =>
    dislikedTips.some(x => tipKey(x) === tipKey(tip));
  const setLikedCache = async (arr: Tip[]) => saveToCache('likedTips', arr);
  const setDislikedCache = async (arr: Tip[]) =>
    saveToCache('dislikedTips', arr);

  useEffect(() => {
    cleanupSound();
  }, [showTipsModal]);

  const speakTip = useCallback(
    async (tip: Tip) => {
      const key = tipKey(tip);

      // If this tip is already playing, toggle to stop
      if (activeAudioKey === key && isPlaying) {
        if (currentSound.current) {
          currentSound.current.stop();
          currentSound.current.release();
          currentSound.current = null;
        }
        setIsPlaying(false);
        setActiveAudioKey(null);
        return;
      }

      // Stop anything else that might be playing
      if (currentSound.current) {
        currentSound.current.stop();
        currentSound.current.release();
        currentSound.current = null;
      }
      setIsPlaying(false);
      setActiveAudioKey(key);

      try {
        // let audioUrl = audioCache.current.get(key);

        let audioUrl = '';

        if (tip.audioUrl) {
          audioUrl = `http://68.183.102.75:4000/audio${tip.audioUrl}`;
          //   audioCache.current.set(key, audioUrl);
        } else {
          const res = await fetch(
            `http://68.183.102.75:4000/generate-tip-audio`,
            // 'http://localhost:4000/generate-tip-audio',
            {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                tipId: tip.id,
                title: tip.title,
                body: tip.body,
                details: tip.details,
              }),
            },
          );

          if (!res.ok) throw new Error('Failed to generate audio');
          const {audioUrl: newUrl} = await res.json();
          audioUrl = `http://68.183.102.75:4000/audio${newUrl}`;
          //   audioUrl = `http://localhost:4000/audio${newUrl}`;
          tip.audioUrl = newUrl;
          //   audioCache.current.set(key, audioUrl);
        }

        if (!audioUrl) return;

        currentSound.current = new Sound(audioUrl, '', err => {
          if (err) {
            console.error('load sound error', err);
            Alert.alert('Error', 'Failed to play audio. Please try again.');
            setIsPlaying(false);
            setActiveAudioKey(null);
            return;
          }
          setIsPlaying(true);
          currentSound.current?.play(success => {
            if (!success)
              Alert.alert('Error', 'Audio playback failed. Please try again.');
            setIsPlaying(false);
            setActiveAudioKey(null);
            currentSound.current?.release();
            currentSound.current = null;
          });
        });
      } catch (e) {
        console.error('playback error', e);
        setIsPlaying(false);
        setActiveAudioKey(null);
      }

      setAudioLoadingIndex(null);
    },
    [activeAudioKey, isPlaying],
  );

  const cleanupSound = () => {
    if (currentSound.current) {
      currentSound.current.stop();
      currentSound.current.release();
      currentSound.current = null;
    }
    setIsPlaying(false);
    setActiveAudioKey(null);
  };

  const postInteraction = async (
    tip: Tip,
    interactionType: 'like' | 'dislike',
  ) => {
    const res = await fetchWithAuth(
      `${BASE_URL}/api/personalization/interactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.access_token}`,
        },
        body: JSON.stringify({
          tipId: tip.id,
          interactionType,
          // Only needed/used if tip.id starts with "generated_"
          tipPayload:
            typeof tip.id !== 'number' ||
            String(tip.id).startsWith('generated_') ||
            tip.isGenerated
              ? {
                  title: tip.title,
                  body: tip.body,
                  details: tip.details,
                  categories: tip.categories || ['generated'],
                }
              : undefined,
        }),
      },
    );
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(msg || `Failed to post ${interactionType}`);
    }
  };

  const queueAIInteraction = async (tip: Tip, reaction: 'like' | 'dislike') => {
    const key = tipKey(tip);
    const queued = (await loadFromCache('aiReactionsQueue')) ?? [];
    const entry = {
      key,
      reaction,
      tipId: tip.id,
      tipPayload: {
        title: tip.title,
        body: tip.body,
        details: tip.details,
        categories: tip.categories || ['generated'],
      },
      at: Date.now(),
    };
    await saveToCache('aiReactionsQueue', [entry, ...queued]);
  };

  const setReaction = async (tip: Tip, reaction: 'like' | 'dislike') => {
    const prevLiked = likedTips;
    const prevDisliked = dislikedTips;
    const sameKey = (a: Tip, b: Tip) => tipKey(a) === tipKey(b);

    try {
      if (reaction === 'like') {
        const nextLikes = isTipLiked(tip) ? likedTips : [tip, ...likedTips];
        const nextDislikes = dislikedTips.filter(t => !sameKey(t, tip));
        setLikedTips(nextLikes);
        setDislikedTips(nextDislikes);
        await Promise.all([
          setLikedCache(nextLikes),
          setDislikedCache(nextDislikes),
        ]);
      } else {
        const nextDislikes = isTipDisliked(tip)
          ? dislikedTips
          : [tip, ...dislikedTips];
        const nextLikes = likedTips.filter(t => !sameKey(t, tip));
        setDislikedTips(nextDislikes);
        setLikedTips(nextLikes);
        await Promise.all([
          setDislikedCache(nextDislikes),
          setLikedCache(nextLikes),
        ]);
      }

      try {
        await postInteraction(tip, reaction);
      } catch (e) {
        // Offline or server hiccup → queue for later with full payload
        await queueAIInteraction(tip, reaction);
      }
    } catch (e) {
      console.error(e);
      setLikedTips(prevLiked);
      setDislikedTips(prevDisliked);
      Alert.alert(
        'Error',
        'Could not update your preference. Please try again.',
      );
    }
  };

  return (
    <Modal
      visible={showTipsModal}
      onShow={() => Keyboard.dismiss()}
      animationType="slide"
      presentationStyle="fullScreen">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Personalized Advice</Text>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowTipsModal(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{paddingBottom: 28}}
          showsVerticalScrollIndicator={false}>
          {tips.length > 0 &&
            tips.map((tip, index) => {
              const key = tipKey(tip);
              // const playing = activeAudioKey === key && isPlaying;

              return (
                <View key={`tip-${key}`} style={styles.tipItem}>
                  <View style={styles.tipCardShadow}>
                    <LinearGradient
                      colors={['#ffffff', '#f8f9fa']}
                      style={styles.tipGradient}>
                      <View style={styles.tipHeader}>
                        <MaterialIcons
                          name="auto-awesome"
                          size={24}
                          color="#8B5CF6"
                          style={{marginRight: 12}}
                        />
                        <Text style={styles.tipTitle}>{tip.title || ''}</Text>
                      </View>

                      <Text style={styles.tipBody}>{tip.body || ''}</Text>
                      <Text style={styles.tipDetails}>{tip.details || ''}</Text>

                      <View style={styles.tipActions}>
                        <TouchableOpacity
                          style={[
                            styles.playButton,
                            activeAudioKey === key &&
                              isPlaying &&
                              styles.stopButton,
                          ]}
                          onPress={() => {
                            if (activeAudioKey === key && isPlaying) {
                              setAudioLoadingIndex(null);
                              cleanupSound();
                            } else {
                              setAudioLoadingIndex(index);
                              speakTip(tip);
                            }
                          }}
                          disabled={audioLoadingIndex === index}>
                          {audioLoadingIndex === index ? (
                            <ActivityIndicator color="white" size="small" />
                          ) : (
                            <Icon
                              name={
                                activeAudioKey === key && isPlaying
                                  ? 'stop'
                                  : 'play-arrow'
                              }
                              size={16}
                              color="white"
                            />
                          )}
                          <Text
                            style={{
                              color: 'white',
                              fontSize: 12,
                              fontWeight: '600',
                              marginLeft: 4,
                            }}>
                            {audioLoadingIndex === index
                              ? 'Loading...'
                              : activeAudioKey === key && isPlaying
                              ? 'Stop'
                              : 'Play'}
                          </Text>
                          {/* <MaterialIcons
                          name={playing ? 'stop' : 'play-arrow'}
                          size={20}
                          color="#fff"
                        /> */}
                          {/* <Text style={styles.playButtonText}>
                          {playing ? 'Stop' : 'Play'}
                        </Text> */}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                            marginLeft: 8,
                            padding: 6,
                          }}
                          onPress={() => {
                            setReaction(tip, 'like');
                          }}>
                          <MaterialIcons
                            name={
                              isTipLiked(tip) ? 'favorite' : 'favorite-border'
                            }
                            size={22}
                            color={isTipLiked(tip) ? '#FF3B30' : '#999'}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                            marginLeft: 4,
                            padding: 6,
                            opacity: tip.isGenerated ? 0.4 : 1,
                          }}
                          onPress={() => setReaction(tip, 'dislike')}>
                          <MaterialIcons
                            name={
                              isTipDisliked(tip)
                                ? 'thumb-down'
                                : 'thumb-down-off-alt'
                            }
                            size={22}
                            color={isTipDisliked(tip) ? '#8B5CF6' : '#999'}
                          />
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </View>
                </View>
              );
            })}

          {tips.length === 0 && <CardSkeleton />}
          {tips.length === 0 && <CardSkeleton />}
          {tips.length === 0 && <CardSkeleton />}
          <View style={{height: 20}} />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default TipsModal;

const styles = StyleSheet.create({
  modalContainer: {flex: 1, backgroundColor: '#fff'},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {fontSize: 18, fontWeight: '600', color: '#333'},
  closeModalButton: {padding: 8},
  modalContent: {flex: 1, padding: 16},

  heroSearch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heroSearchText: {flex: 1, marginLeft: 8, color: '#9AA0A6', fontSize: 15},
  iconBtn: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Tips
  tipItem: {marginBottom: 16},
  tipCardShadow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tipGradient: {borderRadius: 16, padding: 20, elevation: 5},
  tipHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  tipTitle: {fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1},
  tipBody: {fontSize: 16, color: '#444', lineHeight: 24, marginBottom: 12},
  tipDetails: {fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16},
  tipActions: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
  playButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 96,
  },
  stopButton: {backgroundColor: '#FF3B30'},
  playButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
