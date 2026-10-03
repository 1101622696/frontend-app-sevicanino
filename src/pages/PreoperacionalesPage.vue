<template>
  <q-page padding class="bg-grey-2">
<!-- Encabezado -->
<div class="row items-center q-mb-sm">
  <q-icon
    name="fact_check"
    color="positive"
    size="20px"
  />

  <span class="text-subtitle1 text-weight-medium q-ml-xs">
    Preoperacionales
  </span>

  <q-badge
    color="blue-1"
    text-color="blue-9"
    class="q-ml-auto"
    rounded
  >
    {{ preoperacionales.length }}
  </q-badge>
</div>

<!-- Cards -->
<div class="q-gutter-y-sm">
  <q-card
    v-for="preoperacional in preoperacionales"
    :key="preoperacional.consecutivo"
    flat
    bordered
    class="nomina-card cursor-pointer"
    @click="verDetalles(preoperacional.consecutivo)"
  >
    <q-card-section class="q-pa-md">

      <div class="row items-center q-mb-sm">

        <div class="avatar-chip q-mr-md">
          {{ preoperacional.placa?.substring(0,2) }}
        </div>

        <div class="col">
          <div class="text-body2 text-weight-medium">
            {{ preoperacional.placa }}
          </div>

          <div class="text-caption text-grey-6">
            #{{ preoperacional.consecutivo }}
          </div>
        </div>

        <q-space />

        <q-badge
          color="green-1"
          text-color="green-8"
          rounded
        >
          Preoperacional
        </q-badge>

      </div>

      <div class="row q-gutter-sm">

        <div class="metrica-chip col">
          <div class="metrica-label">Viaje</div>
          <div class="metrica-valor">
            {{ preoperacional.codigo_viaje || '-' }}
          </div>
        </div>

        <div class="metrica-chip col">
          <div class="metrica-label">Odómetro</div>
          <div class="metrica-valor">
            {{ preoperacional.odometro }}
          </div>
        </div>

      </div>

      <div
        class="row items-center q-mt-sm"
        style="border-top:1px solid rgba(0,0,0,.06); padding-top:8px"
      >
        <q-icon
          name="event"
          size="13px"
          color="grey-5"
          class="q-mr-xs"
        />

        <span class="text-caption text-grey-5">
          {{ formatFecha(preoperacional.fecha_creacion) }}
        </span>

        <q-space />

        <q-icon
          name="chevron_right"
          color="grey-4"
          size="16px"
        />
      </div>

    </q-card-section>
  </q-card>
</div>

<q-dialog v-model="mostrarDetalles" persistent>
  <q-card
    style="min-width:350px; max-width:95vw; width:500px; border-radius:16px !important;"
  >

<q-card-section class="q-pb-sm">
  <div
    class="row items-center"
    v-if="detallesPreoperacional"
  >
    <div class="avatar-chip q-mr-md">
      {{ detallesPreoperacional.placa?.substring(0,2) }}
    </div>

    <div class="col">
      <div class="text-subtitle1 text-weight-medium">
        {{ detallesPreoperacional.placa }}
      </div>

      <div class="text-caption text-grey-6">
        #{{ detallesPreoperacional.consecutivo }}
      </div>
    </div>

    <q-badge
      color="green-1"
      text-color="green-8"
      rounded
    >
      Preoperacional
    </q-badge>
  </div>
</q-card-section>


  <q-card-section
  v-if="detallesPreoperacional"
  class="q-pt-md"
  style="max-height:65vh; overflow-y:auto"
>

  <!-- Banner -->
  <div class="ganancia-banner ganancia-positiva q-mb-md">
    <div class="text-caption" style="opacity:.7">
      Inspección registrada
    </div>

    <div class="text-h6 text-weight-bold">
      {{ detallesPreoperacional.placa }}
    </div>
  </div>

  <!-- INFORMACIÓN GENERAL -->
  <div class="seccion-titulo">
    Información general
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Consecutivo</span>
    <span class="detalle-valor">
      #{{ detallesPreoperacional.consecutivo }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Placa</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.placa }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Viaje</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.codigo_viaje }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Odómetro</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.odometro }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Galones</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.galones }}
    </span>
  </div>

  <!-- SECCIÓN 1 -->
  <div class="seccion-titulo q-mt-md">
    Motor y fluidos
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Nivel aceite motor</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.nivel_aceite }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Nivel refrigerante</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.refrigerante }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Fugas visibles</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.fugas_visibles }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Correas en buen estado</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.correas }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Filtro de aire</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.filtro_aire }}
    </span>
  </div>

  <!-- SECCIÓN 2 -->
  <div class="seccion-titulo q-mt-md">
    Llantas y suspensión
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Presión de llantas</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.presion_llantas }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Desgaste de llantas</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.desgaste_llantas }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Tuercas ajustadas</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.tuercas_ajustadas }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Suspensión sin fisuras</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.suspension_fisuras }}
    </span>
  </div>

  <!-- SECCIÓN 3 -->
  <div class="seccion-titulo q-mt-md">
    Acople y quinta rueda
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Quinta rueda lubricada</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.quinta_rueda }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Pasador rey asegurado</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.pasador_rey }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Mangueras aire</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.mangueras_aire }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Seguro del acople</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.seguro_acople }}
    </span>
  </div>

  <!-- SECCIÓN 4 -->
  <div class="seccion-titulo q-mt-md">
    Sistema de frenos
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Presión aire</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.presion_frenos }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Fugas audibles</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.fugas_audibles }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Freno de parqueo</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.freno_parqueo }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">ABS</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.abs_sintestigo }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Prueba de freno</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.prueba_freno }}
    </span>
  </div>

  <!-- SECCIÓN 5 -->
  <div class="seccion-titulo q-mt-md">
    Sistema eléctrico y señalización
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Luces bajas y altas</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.luces_altas_bajas }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Direccionales</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.direccionales }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Luces freno</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.luces_freno }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Luces remolque</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.luces_remolque }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Testigos tablero</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.testigo_tablero }}
    </span>
  </div>

  <!-- SECCIÓN 6 -->
  <div class="seccion-titulo q-mt-md">
    Dirección y transmisión
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Volante</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.volante }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Sin fugas hidráulicas</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.sin_fugas }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Cambios suaves</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.cambios_suave }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Sin ruidos anormales</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.sin_ruidos }}
    </span>
  </div>

  <!-- SECCIÓN 7 -->
  <div class="seccion-titulo q-mt-md">
    Cabina y elementos obligatorios
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Cinturón seguridad</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.cinturon_seguridad }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Espejos</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.espejos }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Extintor cabezote</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.extintor_cabezote }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Extintor trailer</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.extintor_trailer }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Botiquín</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.botiquin }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Triángulos reflectivos</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.triangulos_reflectivos }}
    </span>
  </div>

  <!-- REGISTRO -->
  <div class="seccion-titulo q-mt-md">
    Registro
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Usuario</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.usuario }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Correo</span>
    <span class="detalle-valor">
      {{ detallesPreoperacional.correo_usuario }}
    </span>
  </div>

  <div class="detalle-fila">
    <span class="detalle-label">Fecha registro</span>
    <span class="detalle-valor">
      {{ formatFecha(detallesPreoperacional.fecha_creacion) }}
    </span>
  </div>

</q-card-section>

    <q-separator />

          <DriveVisor
            v-model="dialogAbierto"
            :titulo="tituloVisor"
            :archivos="archivos"
            :cargando="cargandoVisor"
            :error="errorVisor"
            :url-archivo="urlArchivo"
            :es-imagen="esImagen"
            :es-pdf="esPdf"
          />
          
    <!-- FOOTER -->
<q-card-actions class="q-pa-md">
  <q-btn
    outline
    color="secondary"
    icon="folder"
    label="Ver archivos"
    size="sm"
    @click="abrirVisor(detallesPreoperacional.link, 'Documentos')"
  />

  <q-space />

  <q-btn
    flat
    label="Cerrar"
    color="primary"
    v-close-popup
  />
</q-card-actions>

  </q-card>
</q-dialog>

      <q-dialog v-model="alert" persistent>
        <q-card class="bg-grey-1">
          <!-- HEADER -->
          <q-card-section class="bg-primary text-white q-py-md">
            <div class="text-h6 text-weight-bold">
              {{ accion == 1 ? 'Agregar Preoperacional' : 'Editar Preoperacional' }}
            </div>
            <div class="text-caption">Complete la inspección preoperacional del vehículo</div>
          </q-card-section>

          <q-card-section class="scroll q-pa-md" style="max-height: 85vh">
            <!-- DATOS PRINCIPALES -->
            <q-card flat bordered class="rounded-borders q-mb-lg shadow-1">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  🚚 Datos principales
                </div>

                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-select
                      filled
                      rounded
                      bg-color="white"
                      v-model="formulario.codigo_viaje"
                      label="Viaje"
                      :options="viajeOptions"
                      option-label="label"
                      option-value="value"
                      emit-value
                      map-options
                    />
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-input
                      filled
                      rounded
                      bg-color="white"
                      v-model="formulario.placa"
                      label="Placa"
                      disable
                    />
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-input
                      filled
                      rounded
                      bg-color="white"
                      v-model.trim="formulario.odometro"
                      label="Odómetro"
                      type="number"
                    />
                  </div>

                  <div class="col-12 col-sm-6">
                    <q-input
                      filled
                      rounded
                      bg-color="white"
                      v-model.trim="formulario.galones"
                      label="Galones"
                      type="number"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- MOTOR -->
            <q-card flat bordered class="rounded-borders q-mb-lg shadow-1">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  🛠️ Motor y fluidos
                </div>

                <div class="row q-col-gutter-md">
                  <div
                    class="col-12"
                    v-for="campo in [
                      ['nivel_agua', 'Nivel de agua'],
                      ['nivel_aceite', 'Nivel de aceite'],
                      ['fugas_visibles', 'Fugas visibles'],
                      ['correas', 'Correas en buen estado'],
                      ['filtro_aire', 'Filtro de aire'],
                    ]"
                    :key="campo[0]"
                  >
                    <CampoPreoperacional v-model="formulario[campo[0]]" :label="campo[1]" />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- DIRECCIÓN -->
            <q-card flat bordered class="rounded-borders q-mb-lg shadow-1">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  🛠️ Dirección y Transmisión
                </div>

                <div class="row q-col-gutter-md">
                  <div
                    class="col-12"
                    v-for="campo in [
                      ['volante', 'Volante sin juego excesivo'],
                      ['sin_fugas', 'Sin fugas hidráulicas'],
                      ['cambios_suave', 'Cambios entran suavemente'],
                      ['sin_ruidos', 'Sin ruidos anormales en diferencial'],
                    ]"
                    :key="campo[0]"
                  >
                    <CampoPreoperacional v-model="formulario[campo[0]]" :label="campo[1]" />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- ACOPLE Y QUINTA RUEDA -->
            <q-card flat bordered class="rounded-borders q-mb-lg shadow-1">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  🛞Acople y quinta ruida
                </div>

                <div class="row q-col-gutter-md">
                  <div
                    class="col-12"
                    v-for="campo in [
                      ['quinta_rueda', 'Quinta rueda lubricada'],
                      ['pasador_rey', 'Pasador rey correctamente asegurado'],
                      ['mangueras_aire', 'Mangueras aire y cable eléctrico en buen estado'],
                      ['seguro_acople', 'Seguro del acople verificado'],
                    ]"
                    :key="campo[0]"
                  >
                    <CampoPreoperacional v-model="formulario[campo[0]]" :label="campo[1]" />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- LLANTAS -->
            <q-card flat bordered class="rounded-borders q-mb-lg shadow-1">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  🛞 Llantas y suspensión
                </div>

                <div class="row q-col-gutter-md">
                  <div
                    class="col-12"
                    v-for="campo in [
                      ['presion_llantas', 'Presión adecuada en llantas'],
                      ['suspension_fisuras', 'Suspensión sin fisuras'],
                      ['tuercas_ajustadas', 'Tuercas ajustadas'],
                      ['desgaste_llantas', 'Sin desgaste irregular'],
                    ]"
                    :key="campo[0]"
                  >
                    <CampoPreoperacional v-model="formulario[campo[0]]" :label="campo[1]" />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- FRENOS -->
            <q-card flat bordered class="rounded-borders q-mb-lg shadow-1">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  🛑 Sistema de frenos
                </div>

                <div class="row q-col-gutter-md">
                  <div
                    class="col-12"
                    v-for="campo in [
                      ['presion_frenos', 'Presión aire 100–125 PSI'],
                      ['fugas_audibles', 'Sin fugas audibles'],
                      ['freno_parqueo', 'Freno de parqueo'],
                      ['abs_sintestigo', 'ABS sin testigo'],
                      ['prueba_freno', 'Prueba de frenado'],
                    ]"
                    :key="campo[0]"
                  >
                    <CampoPreoperacional v-model="formulario[campo[0]]" :label="campo[1]" />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- SISTEMA ELECTRICO -->
            <q-card flat bordered class="rounded-borders q-mb-lg shadow-1">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  💡 Sistema eléctrico
                </div>

                <div class="row q-col-gutter-md">
                  <div
                    class="col-12"
                    v-for="campo in [
                      ['luces_altas_bajas', 'Luces altas y bajas'],
                      ['direccionales', 'Direccionales'],
                      ['luces_freno', 'Luces de freno'],
                      ['luces_remolque', 'Luces del remolque'],
                      ['testigo_tablero', 'Testigos del tablero'],
                    ]"
                    :key="campo[0]"
                  >
                    <CampoPreoperacional v-model="formulario[campo[0]]" :label="campo[1]" />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- CABINA -->
            <q-card flat bordered class="rounded-borders q-mb-lg shadow-1">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  🚦 Cabina y seguridad
                </div>

                <div class="row q-col-gutter-md">
                  <div
                    class="col-12"
                    v-for="campo in [
                      ['cinturon_seguridad', 'Cinturón de seguridad'],
                      ['espejos', 'Espejos ajustados'],
                      ['extintor_cabezote', 'Extintor vigente'],
                      ['botiquin', 'Botiquín completo'],
                      ['triangulos_reflectivos', 'Triángulos reflectivos'],
                    ]"
                    :key="campo[0]"
                  >
                    <CampoPreoperacional v-model="formulario[campo[0]]" :label="campo[1]" />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- OTROS -->
            <q-card flat bordered class="rounded-borders q-mb-lg shadow-1">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  📋 Otros elementos
                </div>

                <div class="row q-col-gutter-md">
                  <div
                    class="col-12"
                    v-for="campo in [
                      ['extintor_trailer', 'Extintor trailer'],
                      ['kit_carretera', 'Kit carretera'],
                      ['senalizacion_conduzco', 'Señalización conduzco'],
                      ['estado_carpa', 'Estado carpa'],
                      ['refrigerante', 'Refrigerante'],
                      ['pito', 'Pito/Bocina'],
                      ['alarma_retroceso', 'Alarma retroceso'],
                      ['placas_visibles', 'Placas visibles'],
                    ]"
                    :key="campo[0]"
                  >
                    <CampoPreoperacional v-model="formulario[campo[0]]" :label="campo[1]" />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- ARCHIVOS -->
            <q-card flat bordered class="rounded-borders shadow-1">
              <q-card-section>
                <div class="text-subtitle1 text-primary text-weight-bold q-mb-md">
                  📎 Adjuntar archivos
                </div>

                <q-file
                  filled
                  rounded
                  bg-color="white"
                  v-model="archivosSeleccionados"
                  label="Seleccionar archivos"
                  multiple
                  clearable
                  use-chips
                  @update:model-value="manejarSeleccionArchivos"
                  accept="image/*, application/pdf, .doc, .docx, .xls, .xlsx, .kml, .kmz"
                />

                <div class="q-mt-md row q-col-gutter-sm">
                  <div v-for="(archivo, index) in formulario.archivos" :key="index" class="col-12">
                    <q-chip
                      removable
                      square
                      color="blue-1"
                      text-color="primary"
                      icon="description"
                      @remove="eliminarArchivo(index)"
                      class="full-width"
                    >
                      {{ archivo.name }}

                      <q-tooltip>
                        {{ archivo.type }} - {{ (archivo.size / 1024).toFixed(2) }} KB
                      </q-tooltip>
                    </q-chip>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-card-section>

          <!-- BOTONES -->
          <q-card-actions class="bg-white q-pa-md" align="between">
            <q-btn flat color="grey-8" label="Cerrar" icon="close" @click="cerrar()" />

            <q-btn
              unelevated
              color="primary"
              :loading="usePreoperacional.loading"
              @click="guardar"
              class="rounded-borders q-px-xl"
            >
              {{ esEdicion ? 'Actualizar' : 'Guardar Preoperacional' }}

              <template #loading>
                <q-spinner color="white" size="1em" />
              </template>
            </q-btn>
          </q-card-actions>
        </q-card>
      </q-dialog>
    <!-- </div> -->

    <!-- <q-btn color="primary" :label="'Registrar nuevo'" class="q-mt-md" @click="abrir" /> -->
 
     <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="abrir" />
    </q-page-sticky>

  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useStorePreoperacionales } from '../stores/preoperacionales'
import { useStoreVehiculos } from '../stores/vehiculos'
import { useStoreUsuarios } from '../stores/usuarios'
import { useQuasar } from 'quasar'
import { guardarPendiente, guardarArchivosOffline } from '../composables/offlineDB'
import CampoPreoperacional from 'src/components/CampoPreoperacional.vue'
import { useDriveVisor } from '../composables/useDriveVisor'
import DriveVisor from 'src/components/VisorDrive.vue'
import { Notify } from 'quasar'

const {
  dialogAbierto,
  archivos,
  cargando: cargandoVisor,
  titulo: tituloVisor,
  error: errorVisor,
  abrirVisor,
  urlArchivo,
  esImagen,
  esPdf,
} = useDriveVisor()

const usePreoperacional = useStorePreoperacionales()
const useVehiculo = useStoreVehiculos()
const useUsuario = useStoreUsuarios()

const perfilUsuario = computed(() => useUsuario.perfile)

const alert = ref(false)
const accion = ref(1)
const $q = useQuasar()

const estadoInicial = {
  codigo_viaje: '',
  placa: '',
  odometro: '',
  nivel_agua: '',
  nivel_aceite: '',
  galones: '',
  fugas_visibles: '',
  presion_frenos: '',
  fugas_audibles: '',
  freno_parqueo: '',
  abs_sintestigo: '',
  prueba_freno: '',
  luces_altas_bajas: '',
  direccionales: '',
  luces_freno: '',
  luces_remolque: '',
  testigo_tablero: '',
  filtro_aire: '',
  volante: '',
  sin_fugas: '',
  cambios_suave: '',
  sin_ruidos: '',
  cinturon_seguridad: '',
  espejos: '',
  extintor_cabezote: '',
  extintor_trailer: '',
  botiquin: '',
  triangulos_reflectivos: '',
  kit_carretera: '',
  senalizacion_conduzco: '',
  correas: '',
  estado_carpa: '',
  refrigerante: '',
  pito: '',
  alarma_retroceso: '',
  presion_llantas: '',
  desgaste_llantas: '',
  tuercas_ajustadas: '',
  suspension_fisuras: '',
  quinta_rueda: '',
  pasador_rey: '',
  mangueras_aire: '',
  seguro_acople: '',
  placas_visibles: '',
  archivos: [],
}

const formulario = ref({ ...estadoInicial })
const cargando = ref(false)

const viajeOptions = ref([])

const preoperacionales = ref([])

const detallesPreoperacional = ref(null)
const mostrarDetalles = ref(false)

function abrir() {
  accion.value = 1
  alert.value = true
}

function cerrar() {
  alert.value = false
}

async function guardar() {
  cargando.value = true
  if (!validar()) { cargando.value = false; return }

  try {
    const formData = new FormData()
    const payloadPlano = {} // para SQLite (FormData no se puede serializar)

    Object.entries(formulario.value).forEach(([key, value]) => {
      if (key === 'archivos') {
        value.forEach((file) => formData.append('archivos', file))
      } else if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value)
        payloadPlano[key] = value // <-- guardar versión serializable
      }
    })

    if (!navigator.onLine) {
      // SIN CONEXIÓN: guardar local
      // await guardarPendiente('preoperacional', payloadPlano)
      const rutasArchivos = await guardarArchivosOffline(formulario.value.archivos)
      await guardarPendiente('preoperacional', { ...payloadPlano, _archivos: rutasArchivos })

      Notify.create({ message: 'Sin conexión. Guardado localmente, se enviará cuando haya señal.', color: 'warning', position: 'bottom' })
      cerrar()
      resetearFormulario()
      return
    }

    // CON CONEXIÓN: flujo normal
    const response = await usePreoperacional.postPreoperacional(formData)
    console.log('Respuesta exitosa:', response)
    cerrar()
    cargarPreoperacionales()
    resetearFormulario()
  } catch (error) {
    console.error('Error al guardar:', error)
    mostrarMensajeError('Error al guardar el preoperacional')
  } finally {
    cargando.value = false
  }
}

async function validar() {
  let verificado = true

  const { codigo_viaje, odometro, galones } = formulario.value

  if (codigo_viaje === '') {
    mostrarMensajeError('Seleccione el código del viaje')
    verificado = false
  }
  if (odometro === '') {
    mostrarMensajeError('Diligencie el odómetro')
    verificado = false
  }
  if (galones === '') {
    mostrarMensajeError('Diligencie los galones que carga ahora el vehículo')
    verificado = false
  }
  return verificado
}

async function verDetalles(consecutivo) {
  try {
    const detalle = await usePreoperacional.obtenerdatospreoperacional(consecutivo)
    // console.log('Detalles obtenidos:', detalle)

    if (detalle) {
      detallesPreoperacional.value = {
        consecutivo: detalle['consecutivo'] || '',
        codigo_viaje: detalle['codigo_viaje'] || '',
        placa: detalle['placa'] || '',
        odometro: detalle['odometro'] || '',
        nivel_agua: detalle['nivel_agua'] || '',
        nivel_aceite: detalle['nivel_aceite'] || '',
        galones: detalle['galones'] || '',
        fugas_visibles: detalle['fugas_visibles'] || '',
        presion_frenos: detalle['presion_frenos'] || '',
        fugas_audibles: detalle['fugas_audibles'] || '',
        freno_parqueo: detalle['freno_parqueo'] || '',
        abs_sintestigo: detalle['abs_sintestigo'] || '',
        prueba_freno: detalle['prueba_freno'] || '',
        luces_altas_bajas: detalle['luces_altas_bajas'] || '',
        direccionales: detalle['direccionales'] || '',
        luces_freno: detalle['luces_freno'] || '',
        luces_remolque: detalle['luces_remolque'] || '',
        testigo_tablero: detalle['testigo_tablero'] || '',
        filtro_aire: detalle['filtro_aire'] || '',
        volante: detalle['volante'] || '',
        sin_fugas: detalle['sin_fugas'] || '',
        cambios_suave: detalle['cambios_suave'] || '',
        sin_ruidos: detalle['sin_ruidos'] || '',
        cinturon_seguridad: detalle['cinturon_seguridad'] || '',
        espejos: detalle['espejos'] || '',
        extintor_cabezote: detalle['extintor_cabezote'] || '',
        extintor_trailer: detalle['extintor_trailer'] || '',
        botiquin: detalle['botiquin'] || '',
        triangulos_reflectivos: detalle['triangulos_reflectivos'] || '',
        kit_carretera: detalle['kit_carretera'] || '',
        senalizacion_conduzco: detalle['senalizacion_conduzco'] || '',
        correas: detalle['correas'] || '',
        estado_carpa: detalle['estado_carpa'] || '',
        refrigerante: detalle['refrigerante'] || '',
        pito: detalle['pito'] || '',
        alarma_retroceso: detalle['alarma_retroceso'] || '',
        presion_llantas: detalle['presion_llantas'] || '',
        desgaste_llantas: detalle['desgaste_llantas'] || '',
        tuercas_ajustadas: detalle['tuercas_ajustadas'] || '',
        suspension_fisuras: detalle['suspension_fisuras'] || '',
        // acople_quintarueda: detalle['acople_quintarueda'] || '',
        quinta_rueda: detalle['quinta_rueda'] || '',
        pasador_rey: detalle['pasador_rey'] || '',
        mangueras_aire: detalle['mangueras_aire'] || '',
        seguro_acople: detalle['seguro_acople'] || '',
        placas_visibles: detalle['placas_visibles'] || '',
        correo_usuario: detalle['correo_usuario'] || '',
        usuario: detalle['usuario'] || '',
        fecha_creacion: detalle['fecha_creacion'] || '',
        link: detalle['link'] || '',
      }
      mostrarDetalles.value = true
    } else {
      console.error('No se pudieron obtener los detalles')
    }
  } catch (error) {
    console.error('Error al obtener detalles:', error)
  }
}

async function cargarPreoperacionales() {
  try {
    let response
    // ADMIN -> todos
    if (perfilUsuario.value === 'administrador') {
      response = await usePreoperacional.obtenerPreoperacionales()
    }

    // PROPIETARIO -> por placas asignadas
    else if (perfilUsuario.value === 'propietario') {
      const placas = useUsuario.user?.placa_asignada || ''

      response = await usePreoperacional.obtenerResumenPorPlaca(placas)

      response = response?.resumen?.total?.consecutivos || []
    }

    // CONDUCTOR -> por sus placas
    else if (perfilUsuario.value === 'conductor') {
      const placas = useUsuario.user?.placa_asignada || ''

      response = await usePreoperacional.obtenerResumenPorPlaca(placas)

      response = response?.resumen?.total?.consecutivos || []
    }
    if (Array.isArray(response)) {
      preoperacionales.value = response.map((item) => ({
        consecutivo: item.consecutivo || '',
        placa: item.placa || '',
        codigo_viaje: item.codigo_viaje || '',
        odometro: item.odometro || '',
        fecha_creacion: item.fecha_creacion || '',
      }))
    } else {
      console.error('Error en formato de respuesta:', response)
      preoperacionales.value = []
    }
  } catch (error) {
    console.error('Error al cargar preoperacionales:', error)
    preoperacionales.value = []
  }
}

onMounted(() => {
  cargarPreoperacionales()
  cargarViajesPreoperacionales()
})

async function cargarViajesPreoperacionales() {
  try {
    const placa = useUsuario.user?.placa_asignada || ''

    const [responseViajes, responsePreop] = await Promise.all([
      useVehiculo.obtenerResumenPorPlaca(placa),
      usePreoperacional.obtenerPreoperacionales(),
    ])
    // console.log('responseViajes', responseViajes)

    if (!responseViajes?.ok) return

    const viajes = responseViajes?.total?.consecutivos || []

    console.log(responseViajes)

    viajes.forEach((v) => {
      console.log(v.consecutivo, v.estado_preoperacional)
    })
    // Códigos de viaje que ya tienen preoperacional
    const viajesConPreop = new Set(
      Array.isArray(responsePreop) ? responsePreop.map((p) => p.codigo_viaje) : [],
    )

    const placasUsuario =
      useUsuario.user?.placa_asignada?.split(',').map((p) => p.trim().toUpperCase()) || []

    viajeOptions.value = (responseViajes?.resumen?.total?.consecutivos || [])
      .filter((v) => {
        const placaViaje = v.placa?.toUpperCase()
        const esPreoperacional = v.estado_preoperacional === 'se debe'
        const sinPreop = !viajesConPreop.has(v.consecutivo)

        if (perfilUsuario.value === 'administrador') {
          return esPreoperacional && sinPreop
        }

        return esPreoperacional && sinPreop && placasUsuario.includes(placaViaje)
      })
      .map((v) => ({
        label: `${v.consecutivo} — ${v.placa} — ${v.destino}`,
        value: v.consecutivo,
        placa: v.placa,
      }))
  } catch (e) {
    console.error(e)
  }
}

watch(
  () => formulario.value.codigo_viaje,
  (nuevoViaje) => {
    if (!nuevoViaje) {
      formulario.value.placa = ''
      return
    }
    const viaje = viajeOptions.value.find((v) => v.value === nuevoViaje)
    formulario.value.placa = viaje?.placa || ''
  },
)

function manejarSeleccionArchivos(files) {
  if (!files) return

  const nuevos = Array.isArray(files) ? files : [files]

  nuevos.forEach((file) => {
    const existe = formulario.value.archivos.some(
      (a) => a.name === file.name && a.size === file.size && a.type === file.type
    )
    if (!existe) {
      formulario.value.archivos.push(file)
    }
  })

  // El q-file queda visualmente "vacío" pero tus chips muestran los acumulados
}

function eliminarArchivo(index) {
  formulario.value.archivos.splice(index, 1)
}

function resetearFormulario() {
  formulario.value = { ...estadoInicial }
  accion.value = 1
}

function mostrarMensajeError(mensaje) {
  $q.notify({
    type: 'negative',
    message: mensaje,
    position: 'bottom-right',
  })
}

function formatFecha(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

defineOptions({
  name: 'PreoperacionalesPage',
})

</script>

<style scoped>
.preoperacionales-card {
  border-radius: 12px !important;
  transition: border-color 0.15s;
}
.preoperacionales-card:active {
  opacity: 0.85;
}

.placa-badge {
  background: #111827;
  color: white;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 3px 10px;
  border-radius: 6px;
  font-family: monospace;
}

.metrica-chip {
  background: #f9fafb;
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 0;
}
.metrica-chip.rendimiento-malo {
  background: #fef2f2;
}
.metrica-chip.rendimiento-bueno {
  background: #f0fdf4;
}
.metrica-label {
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}
.metrica-valor {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-bar {
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px;
}

.filter-scroll {
  overflow-x: auto;
  flex-wrap: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.filter-scroll::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  border-radius: 999px !important;
  font-size: 13px;
  flex-shrink: 0;
}

.avatar-chip {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #eff6ff;
  color: #1e50a2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.placa-badge-lg {
  background: #111827;
  color: white;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 6px 20px;
  border-radius: 8px;
  font-family: monospace;
}

.detalle-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.detalle-fila:last-child {
  border-bottom: none;
}
.detalle-label {
  font-size: 13px;
  color: #9CA3AF;
}
.detalle-valor {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  text-align: right;
  max-width: 60%;
}

</style>