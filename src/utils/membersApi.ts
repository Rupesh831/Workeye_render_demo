/**
 * MEMBERS API - Direct and Simple Approach
 * No complex retries, just straightforward API calls
 */

const BACKEND_URL = 'https://backend-35m2.onrender.com';
const MEMBERS_ENDPOINT = `${BACKEND_URL}/api/members/`;

export interface Member {
  id: number;
  email: string;
  full_name: string;
  employee_id?: string;
  department?: string;
  position?: string;
  status: string;
  is_active: boolean;
  last_punch_in?: string | null;
  last_punch_out?: string | null;
  created_at: string;
  updated_at?: string | null;
  is_currently_tracking?: boolean;
}

/**
 * Simple fetch with proper error handling
 */
async function simpleFetch(url: string, options: RequestInit = {}) {
  console.log(`🌐 Fetching: ${url}`);
  console.log(`📋 Method: ${options.method || 'GET'}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      mode: 'cors',
    });

    console.log(`📡 Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error response: ${errorText}`);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Success:`, data);
    return data;
  } catch (error) {
    console.error(`❌ Fetch failed:`, error);
    throw error;
  }
}

/**
 * Get all members
 */
export async function getAllMembers(): Promise<Member[]> {
  try {
    const data = await simpleFetch(MEMBERS_ENDPOINT);
    
    if (data.success && Array.isArray(data.members)) {
      return data.members;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Failed to get members:', error);
    throw error;
  }
}

/**
 * Add a new member
 */
export async function addMember(memberData: {
  email: string;
  full_name: string;
  employee_id?: string;
  department?: string;
  position?: string;
}): Promise<Member> {
  try {
    console.log('➕ Adding member:', memberData);
    
    const data = await simpleFetch(MEMBERS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });

    if (data.success && data.member) {
      return data.member;
    }

    throw new Error(data.error || 'Failed to add member');
  } catch (error) {
    console.error('Failed to add member:', error);
    throw error;
  }
}

/**
 * Update a member
 */
export async function updateMember(
  id: number,
  updates: Partial<Member>
): Promise<Member> {
  try {
    console.log(`✏️ Updating member ${id}:`, updates);
    
    const data = await simpleFetch(`${MEMBERS_ENDPOINT}${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (data.success && data.member) {
      return data.member;
    }

    throw new Error(data.error || 'Failed to update member');
  } catch (error) {
    console.error('Failed to update member:', error);
    throw error;
  }
}

/**
 * Delete a member
 */
export async function deleteMember(id: number): Promise<void> {
  try {
    console.log(`🗑️ Deleting member ${id}`);
    
    const data = await simpleFetch(`${MEMBERS_ENDPOINT}${id}`, {
      method: 'DELETE',
    });

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete member');
    }
  } catch (error) {
    console.error('Failed to delete member:', error);
    throw error;
  }
}

/**
 * Test backend connection
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    console.log('🔌 Testing backend connection...');
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      mode: 'cors',
    });
    
    const connected = response.ok;
    console.log(connected ? '✅ Backend connected' : '❌ Backend not responding');
    return connected;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
}
