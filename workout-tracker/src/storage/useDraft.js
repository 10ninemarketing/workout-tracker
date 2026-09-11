import { useEffect, useState } from 'react'

const KEY = 'wt_draft_v1'

// The in-progress workout lives outside the Workout screen and is saved on
// every change, so switching tabs or iOS closing the app never loses it.
export function useDraft(){
  const [draft, setDraft] = useState(() => {
    try{
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : null
    }catch{
      return null
    }
  })

  useEffect(() => {
    try{
      if (draft) localStorage.setItem(KEY, JSON.stringify(draft))
      else localStorage.removeItem(KEY)
    }catch{}
  }, [draft])

  return [draft, setDraft]
}
