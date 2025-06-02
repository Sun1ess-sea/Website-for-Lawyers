document.addEventListener('DOMContentLoaded', () => {
    const specializationSelect = document.getElementById('specialization');
    const lawyerSelect = document.getElementById('lawyer');
    const calendarInput = document.getElementById('calendar');
    const timeSlotsDiv = document.getElementById('time-slots');
    const selectedInfoDiv = document.getElementById('selected-info');
    const clientInfoDiv = document.getElementById('client-info');
    const bookingForm = document.getElementById('booking-form');
  
    let schedule = [];
    let selectedDate = '';
    let selectedTime = '';
    let selectedScheduleId = '';
  
    specializationSelect.addEventListener('change', async () => {
      const ls_id = specializationSelect.value;
  
      lawyerSelect.innerHTML = '<option value="">Загрузка...</option>';
      lawyerSelect.disabled = true;
      calendarInput.disabled = true;
      timeSlotsDiv.innerHTML = '';
      selectedInfoDiv.innerHTML = '';
      clientInfoDiv.style.display = 'none';
  
      try {
        const res = await fetch(`/contacts/lawyers/${ls_id}`);
        if (!res.ok) throw new Error(`Ошибка при получении адвокатов (${res.status})`);
  
        const lawyers = await res.json();
        if (!Array.isArray(lawyers)) throw new Error('Ответ не является массивом');
  
        lawyerSelect.innerHTML = '<option value="">Выберите адвоката</option>';
        lawyers.forEach(l => {
          const opt = document.createElement('option');
          opt.value = l.lawyer_id;
          opt.textContent = l.lawyer_name;
          lawyerSelect.appendChild(opt);
        });
        lawyerSelect.disabled = false;
      } catch (err) {
        console.error('Ошибка загрузки адвокатов:', err);
        lawyerSelect.innerHTML = '<option value="">Выберите специализацию</option>';
      }
    });
  
    lawyerSelect.addEventListener('change', async () => {
      const lawyer_id = lawyerSelect.value;
      if (!lawyer_id) return;
  
      try {
        const res = await fetch(`/contacts/schedule/${lawyer_id}`);
        if (!res.ok) throw new Error(`Ошибка при получении расписания (${res.status})`);
  
        schedule = await res.json();
        const availableDates = [...new Set(schedule.map(item => item.booking_date.split('T')[0]))];
  
        const today = new Date().toISOString().split('T')[0];
        const futureDates = availableDates.filter(date => date >= today);
  
        flatpickr("#calendar", {
          enable: futureDates,
          dateFormat: "Y-m-d",
          onChange: function (selectedDates, dateStr) {
            selectedDate = dateStr;
            updateTimeSlots(dateStr);
          }
        });
  
        calendarInput.disabled = false;
      } catch (err) {
        console.error('Ошибка загрузки расписания:', err);
        calendarInput.disabled = true;
        timeSlotsDiv.innerHTML = '<p class="text-danger">Ошибка загрузки расписания</p>';
      }
    });
  
    function updateTimeSlots(dateStr) {
      const slots = schedule.filter(s => {
        const slotDate = new Date(s.booking_date);
        const localDate = slotDate.toLocaleDateString('en-CA');
        return localDate === dateStr;
      });

      timeSlotsDiv.innerHTML = '';

      if (slots.length === 0) {
        timeSlotsDiv.textContent = "Нет доступного времени";
        clientInfoDiv.style.display = 'none';
        return;
      }

      const container = document.createElement('div');
      container.className = 'time-buttons';

      const now = new Date();
      const isToday = now.toLocaleDateString('en-CA') === dateStr;

      slots.forEach(slot => {
        const slotDate = new Date(slot.booking_date);
        const time = slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const btn = document.createElement('button');
        btn.textContent = time;
        btn.className = 'time-button';
        btn.type = 'button';

        const slotTimeValue = slotDate.getTime();
        const nowTimeValue = now.getTime();

        if (isToday && slotTimeValue <= nowTimeValue) {
          btn.disabled = true;
          btn.classList.add('disabled-slot');
        } else {
          btn.onclick = () => {
            document.querySelectorAll('.time-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedTime = time;
            selectedScheduleId = slot.schedule_id;

            selectedInfoDiv.innerHTML = `Вы выбрали: <strong>${dateStr}</strong> в <strong>${time}</strong>`;
            clientInfoDiv.style.display = 'block';
          };
        }

        container.appendChild(btn);
      });

      timeSlotsDiv.appendChild(container);
    }

  
    bookingForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('client_email').value.trim();
      const phone = document.getElementById('client_phone').value.trim();
      const name = document.getElementById('client_name').value.trim();
      const privacyChecked = document.getElementById('privacy_policy').checked;

      selectedInfoDiv.innerHTML = '';

      if (!selectedScheduleId) {
        selectedInfoDiv.innerHTML = '<p class="text-danger">Пожалуйста, выберите дату и время.</p>';
        return;
      }

      if (!email || !phone || !name) {
        selectedInfoDiv.innerHTML = '<p class="text-danger">Пожалуйста, заполните все поля: email, телефон и имя.</p>';
        return;
      }

      if (!privacyChecked) {
        selectedInfoDiv.innerHTML = '<p class="text-danger">Пожалуйста, подтвердите согласие с пользовательским соглашением.</p>';
        return;
      }

      try {
        const res = await fetch('/contacts/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schedule_id: selectedScheduleId,
            client_email: email,
            client_phone: phone,
            client_name: name
          })
        });

        if (res.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Запись успешна',
            text: 'Вы записались на консультацию',
            confirmButtonColor: '#d4af37'
          }).then(() => {
            window.location.reload();
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Ошибка',
            text: 'Ошибка при записи. Попробуйте снова.',
            confirmButtonColor: '#d4af37'
          });
        }
      } catch (err) {
        console.error('Ошибка при отправке данных:', err);
        Swal.fire({
          icon: 'error',
          title: 'Ошибка соединения',
          text: 'Не удалось связаться с сервером.',
          confirmButtonColor: '#d4af37'
        });
      }

    });
});
  