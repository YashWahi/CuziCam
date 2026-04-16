'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Tag } from '@/components/Tag';
import styles from './page.module.css';

interface College {
  id: string;
  name: string;
  domain: string;
}

const INTERESTS = [
  'Coding', 'Design', 'Hackathons', 'Gaming', 'Greek Life', 
  'Entrepreneurship', 'Basketball', 'Football', 'Soccer', 
  'Anime', 'Photography', 'Music Production', 'Hiking', 
  'Debate', 'Theater', 'Chess', 'Investing', 'Fitness', 
  'Cooking', 'Travel', 'Art', 'Sustainability', 'Psychology'
];

export default function OnboardingPage() {
  const { user, updateUser } = useAuth() as any; // Cast as any to avoid type check issues if interface hasn't propagated
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [isCollegesLoading, setIsCollegesLoading] = useState(true);
  const [collegesError, setCollegesError] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    year: user?.year || '',
    branch: user?.branch || '',
    collegeId: (user?.college as any)?.id || '',
    bio: user?.bio || '',
    interests: Array.isArray(user?.interests) ? (user.interests as string[]) : [] as string[],
    preferences: {
      videoEnabled: true,
      textEnabled: true,
      matchLevel: 'vibes' // 'vibes' or 'random'
    }
  });

  const fetchColleges = useCallback(async () => {
    setIsCollegesLoading(true);
    setCollegesError(false);
    try {
      const response = await userApi.getColleges() as any;
      setColleges(response.data || response);
    } catch (err) {
      console.error('Failed to fetch colleges', err);
      setCollegesError(true);
    } finally {
      setIsCollegesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  const filteredColleges = colleges.filter(c => 
    c.name.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  const toggleInterest = (interest: string) => {
    setFormData(prev => {
      const interests = (prev.interests as string[]).includes(interest)
        ? (prev.interests as string[]).filter(i => i !== interest)
        : [...(prev.interests as string[]), interest];
      return { ...prev, interests };
    });
  };

  const nextStep = () => {
    // Basic validation check before moving
    if (step === 1) {
      if (!formData.collegeId || !formData.year) return;
    } else if (step === 2) {
      if (formData.interests.length < 3) return;
    }

    if (step < 3) setStep(step + 1);
    else handleComplete();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!formData.collegeId || !formData.year) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(false);

    try {
      const response = await userApi.completeOnboarding({
        collegeId: formData.collegeId,
        year: formData.year,
        branch: formData.branch,
        interests: formData.interests,
        bio: formData.bio,
        preferences: formData.preferences
      }) as any;
      
      updateUser(response.data || response.user || response);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding submission failed', err);
      setSubmitError(true);
      setIsSubmitting(false);
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return !formData.collegeId || !formData.year;
    if (step === 2) return formData.interests.length < 3;
    return isSubmitting;
  };

  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.bgOrnament} />
      <div className={styles.bgOrnamentBottom} />

      <motion.div 
        className={styles.onboardingCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.header}>
          <div className={styles.stepIndicator}>
            {[1, 2, 3].map(s => (
              <div 
                key={s} 
                className={`${styles.stepDot} ${s <= step ? styles.stepDotActive : ''}`} 
              />
            ))}
          </div>
          <h1 className="serif">
            {step === 1 && "Tell us about you"}
            {step === 2 && "Pick your interests"}
            {step === 3 && "Set your vibes"}
          </h1>
          <p className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Step {step} of 3
          </p>
        </div>

        {submitError && (
          <div className={styles.errorBanner}>
            <p className="mono">Something went wrong. Please try again.</p>
            <Button size="sm" onClick={() => handleComplete()} loading={isSubmitting}>Retry</Button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={styles.formStep}
          >
            {step === 1 && (
              <>
                <Input 
                  label="Graduation Year *" 
                  placeholder="e.g. 2027" 
                  value={formData.year}
                  onChange={e => setFormData({...formData, year: e.target.value})}
                  fullWidth
                />
                <Input 
                  label="Major / Branch (Optional)" 
                  placeholder="e.g. Computer Science" 
                  value={formData.branch}
                  onChange={e => setFormData({...formData, branch: e.target.value})}
                  fullWidth
                />
                <div className={styles.collegeSelector}>
                  <label className="mono" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                    Select College *
                  </label>
                  <Input 
                    placeholder="Search your college..." 
                    value={collegeSearch}
                    onChange={e => setCollegeSearch(e.target.value)}
                    fullWidth
                  />
                  <div className={styles.collegeList}>
                    {isCollegesLoading ? (
                      <p className="mono" style={{ fontSize: '0.8rem', padding: '1rem' }}>Loading colleges...</p>
                    ) : collegesError ? (
                      <div className={styles.retryArea}>
                        <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--error)' }}>
                          Couldn't load colleges. Please check your connection.
                        </p>
                        <Button size="sm" variant="ghost" onClick={() => fetchColleges()}>Retry</Button>
                      </div>
                    ) : filteredColleges.length > 0 ? (
                      filteredColleges.map(college => (
                        <div 
                          key={college.id}
                          className={`${styles.collegeItem} ${formData.collegeId === college.id ? styles.selected : ''}`}
                          onClick={() => setFormData({ ...formData, collegeId: college.id })}
                        >
                          <span className="mono">{college.name}</span>
                          <span className={styles.domain}>{college.domain}</span>
                        </div>
                      ))
                    ) : (
                      <p className="mono" style={{ fontSize: '0.8rem', padding: '1rem' }}>No colleges found.</p>
                    )}
                  </div>
                </div>

                <Input 
                  label="Bio (Optional)" 
                  placeholder="A short punchy intro..." 
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  fullWidth
                />
              </>
            )}

            {step === 2 && (
              <>
                <p className="mono" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  Select at least 3 things you're into:
                </p>
                <div className={styles.interestGrid}>
                  {INTERESTS.map(interest => (
                    <div 
                      key={interest} 
                      onClick={() => toggleInterest(interest)}
                      className={styles.interestTag}
                    >
                      <Tag 
                        variant={formData.interests.includes(interest) ? 'secondary' : 'outline'} 
                      >
                        {interest}
                      </Tag>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="mono" style={{ display: 'block', marginBottom: '1rem' }}>Matching Mode</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Button 
                      variant={formData.preferences.matchLevel === 'vibes' ? 'primary' : 'outline'}
                      onClick={() => setFormData({
                        ...formData, 
                        preferences: { ...formData.preferences, matchLevel: 'vibes' }
                      })}
                    >
                      Vibe Match
                    </Button>
                    <Button 
                      variant={formData.preferences.matchLevel === 'random' ? 'primary' : 'outline'}
                      onClick={() => setFormData({
                        ...formData, 
                        preferences: { ...formData.preferences, matchLevel: 'random' }
                      })}
                    >
                      Chaos Mode
                    </Button>
                  </div>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formData.preferences.matchLevel === 'vibes' 
                      ? "We'll match you with students who share your interests." 
                      : "Total randomness. Anything can happen."}
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input 
                    type="checkbox" 
                    id="video" 
                    checked={formData.preferences.videoEnabled}
                    onChange={e => setFormData({
                      ...formData, 
                      preferences: { ...formData.preferences, videoEnabled: e.target.checked }
                    })}
                  />
                  <label htmlFor="video" className="mono">Enable Video Match</label>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className={styles.footer}>
          <Button 
            variant="ghost" 
            onClick={prevStep} 
            disabled={step === 1 || isSubmitting}
          >
            Back
          </Button>
          <Button 
            variant="primary" 
            onClick={nextStep}
            disabled={isNextDisabled()}
            loading={isSubmitting}
          >
            {step === 3 ? "Let's Go!" : "Continue"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
